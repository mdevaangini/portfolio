# 18 — Comments and Reactions: Design

[← Docs home](README.md)

**Status:** 🚧 Building. C1 (tables) ✅ · C2 (reactions API) ✅ · C3 (public comments API) ✅ · C4 (admin moderation API) ✅ · C5 (reaction bar) ✅ · C6 (comments on the article) written.
**Written:** 16 Nov 2026 · **Decisions:** "your picks" (16 Nov 2026)

The design (an "RFC") for letting visitors **react to** and **comment on** blog posts. In a company, a page like this is written and reviewed **before** coding, so everyone agrees on the tables, the API and the screens, and the edge cases are found on paper, not in production.

---

## 1. The decisions

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Who can comment? | **A name only, no account** | teaches database, API, validation, abuse protection and Angular without a huge new topic. "Sign in with GitHub" (OAuth) can come later, on top |
| 2 | When do comments appear? | **I approve each one first** | anonymous comments attract spam; nothing reaches the live site unchecked |
| 3 | Threading | **One level**: comments, and replies to comments; no replies to replies | readable on phones; simple data (`parentId` always points to a top-level comment). YouTube and LinkedIn work this way |
| 4 | Reactions | **👍 Like · ❤️ Love · 💡 Insightful** | a small fixed set; more only adds clutter |
| 5 | "One per person" without accounts | **One per browser**, via a random anonymous `visitor_id` cookie | anonymous, no personal data; reuses the httpOnly cookie knowledge. Clearing cookies allows a second reaction: acceptable for reactions |
| 6 | What visitors may write | **Plain text only**: no HTML, no Markdown | nothing in a comment can ever run as code (XSS) |

---

## 2. User stories (who does what)

**A visitor can…**
- see the reaction counts on a post, and add or remove their own reactions (each type once);
- read the approved comments and their replies;
- write a comment, or a reply to a comment, with a name;
- after sending, see "Thanks! Your comment will appear after review."

**I (the admin) can…**
- see the comments waiting for review, newest first, with the post they belong to;
- **approve** or **reject** each one, and delete one later;
- reply as the author: my replies appear immediately, marked **"Author"**.

**Not in the first version:** email notifications to me, sign-in for visitors, editing comments, reactions on comments, comment counts on the blog cards.

---

## 3. Data model (two new tables, two new enums)

```prisma
enum CommentStatus {
  PENDING    // waiting for my review (every new visitor comment)
  APPROVED   // visible on the post
  REJECTED   // never shown (spam or not suitable)
  @@map("comment_status")
}

enum ReactionType {
  LIKE        // 👍
  LOVE        // ❤️
  INSIGHTFUL  // 💡
  @@map("reaction_type")
}

model Comment {
  id         Int           @id @default(autoincrement())
  postId     Int           @map("post_id")
  post       Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  /// Empty = a top-level comment. Otherwise the TOP-LEVEL comment this replies to.
  parentId   Int?          @map("parent_id")
  parent     Comment?      @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
  replies    Comment[]     @relation("Replies")
  authorName String        @map("author_name") @db.VarChar(50)
  body       String        @db.VarChar(2000)
  /// true = written by me (the admin); shown with an "Author" badge.
  isAuthor   Boolean       @default(false) @map("is_author")
  status     CommentStatus @default(PENDING)
  /// The anonymous browser id (for rate limiting). Never shown.
  visitorId  String?       @map("visitor_id") @db.VarChar(36)
  createdAt  DateTime      @default(now()) @map("created_at")
  approvedAt DateTime?     @map("approved_at")
  /// Soft delete, like posts.
  deletedAt  DateTime?     @map("deleted_at")

  @@index([postId, status, createdAt])  // "approved comments of this post, oldest first"
  @@index([status, createdAt])          // the admin's "waiting for review" list
  @@index([parentId])
  @@map("comments")
}

model Reaction {
  id        Int          @id @default(autoincrement())
  postId    Int          @map("post_id")
  post      Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  type      ReactionType
  visitorId String       @map("visitor_id") @db.VarChar(36)
  createdAt DateTime     @default(now()) @map("created_at")

  /// THE rule "one per browser per type": the database itself refuses a second row.
  @@unique([postId, visitorId, type])
  @@index([postId, type])
  @@map("reactions")
}
```
Plus `comments Comment[]` and `reactions Reaction[]` on `Post`. **One migration** creates all of it.

**Why these choices**
- **`parentId` on the same table** (a *self-relation*): a reply is just a comment with a parent. One level is enforced **in the API**: the parent must itself have no parent.
- **`@@unique([postId, visitorId, type])`**: "one 👍 per browser per post" is guaranteed by the **database**, even if two clicks arrive at the same moment (the same idea as the unique slug).
- **No email column:** we don't ask for it, so we don't store it. Less personal data = less to protect.
- **`onDelete: Cascade`**: if a post is ever *really* deleted, its comments and reactions go with it. (A normal delete is still the soft delete.)

---

## 4. The anonymous visitor id (cookie)
```
first time a browser reacts or comments:
  the API makes a random id (crypto.randomUUID(), e.g. "7f3c…")
  → Set-Cookie: visitor_id=7f3c…; Path=/api/posts; Max-Age=1 year; HttpOnly; Secure; SameSite=Strict
later requests: the browser sends it by itself → the API knows "same browser as before"
```
- It says **nothing about who you are**: it's a random number, not a login.
- **HttpOnly**, so scripts can't read or change it; `Path=/api/posts`, so it only travels to the blog endpoints.
- The API **trusts only its own format** (a valid UUID); anything else is replaced with a new one.

---

## 5. API

### Public (visitors; drafts and unknown slugs → 404, like the article)
| Method | Address | Body | Answer |
|---|---|---|---|
| GET | `/api/posts/:slug/reactions` | — | `200 { counts: { like: 4, love: 1, insightful: 0 }, mine: ["like"] }` (`mine` from the cookie; names are lowercase in URLs and JSON, uppercase only in the database enum) |
| PUT | `/api/posts/:slug/reactions/:type` | — | **add** my reaction (`:type` = `like` · `love` · `insightful`) → `200` + the new counts. Doing it twice changes nothing (*idempotent*). Unknown type → 400 |
| DELETE | `/api/posts/:slug/reactions/:type` | — | **remove** my reaction → `200` + the new counts |
| GET | `/api/posts/:slug/comments` | — | `200 { data: [ { id, authorName, isAuthor, body, createdAt, replies: [ … ] } ], total }` (`total` = comments + replies): **approved only**, top-level and replies **oldest first** (a conversation reads top to bottom) |
| POST | `/api/posts/:slug/comments` | `{ authorName, body, parentId?, website }` | `202 { status: "PENDING", message }` ("accepted, not visible yet"); `400` field errors; `404` post; `429` too many |

**Why PUT/DELETE for reactions (not one "toggle")?** "Make sure my 👍 is there" (PUT) and "make sure it's gone" (DELETE) give the same result however often they're sent: a double-click or a retry can't flip the state by accident.

### Rules for `POST …/comments` (in this order)
1. **Honeypot:** `website` filled → answer `202` as if fine, save **nothing** (the trick from the contact form).
2. **Zod:** `authorName` 2–50 characters, `body` 2–2000 characters, trimmed; `parentId` optional, a positive whole number.
3. The post must be **published and not deleted** → otherwise 404.
4. If `parentId` is given: that comment must belong to **the same post**, be **APPROVED**, and be **top-level** (no parent) → otherwise 400 "You can only reply to a comment."
5. **Rate limits** (counted in the database, like the contact form): at most **3 comments per browser per 10 minutes**, and **30 per post per hour** → 429.
6. Save it as **PENDING** with the visitor id → 202.

### Admin (behind `checkOrigin` + `requireAdmin`, like the posts admin)
| Method | Address | Does |
|---|---|---|
| GET | `/api/admin/comments?status=pending` | `{ data, counts: { pending, approved, rejected } }`: the list (newest first, with the post and the comment it replies to); `counts.pending` = the badge |
| POST | `/api/admin/comments/:id/approve` | → APPROVED (+ `approvedAt`) |
| POST | `/api/admin/comments/:id/reject` | → REJECTED |
| DELETE | `/api/admin/comments/:id` | soft delete (hidden everywhere) |
| POST | `/api/admin/comments/:id/reply` | my reply as the author: `isAuthor: true`, **APPROVED immediately** (201). Replying to a **reply** attaches it to the top-level comment; replying to a **pending** comment **approves it too** ("replying = accepting"); a **rejected** one → 400 |

**Plus:** the public POST endpoints also get `checkOrigin`, so only my own website can send them.

---

## 6. Screens (Angular)

**Article page** (`/blog/:slug`), under the article:
```
┌───────────────────────────────────────────────┐
│  👍 4    ❤️ 1    💡 0                          │  ← buttons; mine are highlighted
├───────────────────────────────────────────────┤
│  3 comments                                    │
│  Asha · 2 days ago                             │
│    Great explanation of hasValue()!            │
│    ↳ Devaangini [Author] · 1 day ago           │
│        Thanks Asha!                            │
│    [Reply]                                     │
│  Neel · 5 hours ago                            │
│    …                                           │
├───────────────────────────────────────────────┤
│  Leave a comment                               │
│  Name [__________]                             │
│  Comment [___________________________]         │
│  (hidden: website)              [Send]         │
└───────────────────────────────────────────────┘
```
- **Reactions:** a click changes the count **immediately** (an *optimistic update*), then the API confirms; if it fails, the count goes back and a short message appears.
- **Reply:** opens the same small form **under that comment**.
- After sending: the form is replaced by "Thanks! Your comment will appear after review."
- My name is remembered in the browser (`localStorage`), so I don't type it each time: a convenience only.
- Comments are shown with `{{ }}` (plain text), **never** `[innerHTML]`.

**Admin:** a new **Comments** page (`/admin/comments`): the pending queue with Approve / Reject / Reply, and a **badge** with the pending count in the admin top bar.

---

## 7. Security, abuse and privacy

| Risk | Protection |
|---|---|
| Spam bots | honeypot field · rate limits · **approval before anything is visible** · Vercel firewall per IP (already there) |
| Script injection (XSS) through a comment | plain text only; Angular escapes `{{ }}`; never `[innerHTML]` for comments |
| Very long or empty text | Zod limits + column sizes (2–2000 characters) |
| Replies to replies, or to another post's comment | the API checks the parent (rule 4) |
| Reaction spamming | the unique constraint + PUT/DELETE (idempotent); clearing cookies allows one more per type: accepted |
| Other websites posting as a visitor | `checkOrigin` + `SameSite=Strict` cookie |
| Personal data | no emails; a random visitor id; no IP addresses stored |
| Comments on drafts | every public endpoint uses the same `visible` rule → 404 |

---

## 8. Edge cases (found on paper)
- A post is **unpublished** → its comments and reactions disappear with it (404) and come back when it's published again.
- An approved comment is **deleted** while it has replies → the replies are hidden too (they'd make no sense alone).
- I **reject** a comment → the visitor is never told (normal for moderation).
- Two clicks on 👍 at the same moment → the database keeps one row; the second gets "already there", which is fine for PUT.
- A visitor sends a reply to a comment that was **rejected in the meantime** → 400.
- 500 comments on one post → the first version shows all approved ones (a blog won't get that many); paging comes later if needed.

---

## 9. Build plan (milestones)
| Step | What | Test |
|---|---|---|
| **C1** | migration: the 2 tables, 2 enums, relations on `Post` | pgAdmin shows the tables |
| **C2** | API: reactions (GET, PUT, DELETE) + the visitor cookie | Vitest + Postman |
| **C3** | API: public comments (GET, POST with all rules) | Vitest + Postman (honeypot, 429, parent rules) |
| **C4** | API: admin moderation + author reply | Postman |
| **C5** | Angular: the reaction bar (optimistic update) | in the browser |
| **C6** | Angular: the comments list + form + reply | in the browser |
| **C7** | Angular: admin Comments page + pending badge | in the browser |
| **C8** | go-live (`git push`; the migration runs on Vercel) + docs + playbook entries | the live site |

Each step: I explain the flow → code → you test → commit, as before.

---

## 10. Open questions for my review
1. Comments **oldest first** (a conversation) or **newest first**? *Proposed: oldest first.*
2. Show the **comment count** on blog cards ("3 comments")? *Proposed: later.*
3. Should **my own** comments (not replies) also be possible from the article page while logged in? *Proposed: no; I reply from the admin.*
