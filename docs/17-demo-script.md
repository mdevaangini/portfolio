# 17 — Demo Script

[← Docs home](README.md)

**A 15–20 minute walkthrough of the portfolio for a friend, guide or interviewer**: what to show, in which order, what to say, and the questions to expect. Each step points to the document with the details.

---

## Before the demo (10 minutes)
- [ ] Open the **live site** in a normal window, and once more in a **private window** (a visitor, not logged in).
- [ ] Log in to `/admin` in the normal window. Have **one draft** ready to publish live (or write a tiny one).
- [ ] Open **DevTools → Network** in the normal window, to show requests.
- [ ] Open VS Code with the repo: `PROJECT_MAP.md`, `web/src/app/`, `api/src/` visible.
- [ ] **Backup:** if the live site has a problem, run it locally (`npm run dev` in `api/`, `npm start` in `web/`).
- [ ] Keep the FAQ (`docs/12`) open for a quick search.

---

## 1. The opening: what it is (1 minute)
**Show:** Home, at the top.

**Say:**
> "This is my portfolio, built end to end as a learning project at company level: an **Angular 22** frontend, an **Express API in TypeScript**, and a **PostgreSQL** database, deployed on **Vercel** with **Neon** as the live database. It has my work and experience, a contact form, and a **blog** I write myself through my own admin area."

**One picture to draw or show** (`docs/02`):
```
Browser (Angular) ──/api──▶ Express API ──Prisma──▶ PostgreSQL (Neon)
```

---

## 2. Home: the public site (2 minutes)
**Show:** scroll down slowly: Expertise → Projects → Experience → Skills → **Latest writing** → Contact.

**Say, while scrolling:**
- "The data (projects, experience, skills) comes from the **API and the database**, not from the code."
- At Projects: "This section is **deferred**: its code and its API call only start when you scroll near it (`@defer (on viewport)`)."
- At the category chips: "Filtering re-fetches automatically: the request is an `httpResource` that reacts to a signal."
- At Latest writing: "The 3 newest posts, from the blog feature, also deferred, and **hidden** when there are no posts."

**Show in DevTools → Network:** the `/api/posts` request appears only when you reach the bottom.

📖 `docs/15` §4, §5 · `docs/16` entries 12, 17

---

## 3. The blog: list and article (3 minutes)
**Show:** click **blog** in the header → click a **tag chip** → point at the URL (`/blog?tag=angular`) → **Reload** (the filter stays) → **Back**.

**Say:**
> "The URL is the source of truth. The chip is just a link: it changes the address, the router hands the tag to the page as an input, and `httpResource` fetches again. The **API filters in the database**, because the browser only has one page of posts. That's why Reload, Back and shared links all keep the filter."

**Show:** open your post → the tab title changes → scroll the Markdown → click a tag in the article.

**Say:**
- "The article is Markdown rendered by a **pure pipe**, bound with `[innerHTML]`, so **Angular's sanitizer** blocks scripts (XSS)."
- "The tab title and description come from the post (`Title` and `Meta` services)."

**Show:** open `/blog/does-not-exist` → "This post doesn't exist".
> "Drafts give the **same 404** as unknown slugs, so nobody can tell a draft exists. A 404 gets a not-found page; real errors get Try again."

📖 `docs/15` §7b · FAQ "the order slip"

---

## 3b. Reactions and comments (2 minutes)
**Show (private window):** under your post, click 👍 → the number changes **instantly** → reload: it stays. Write a comment → "Thanks! Your comment will appear after review."

**Say:**
> "Visitors have no accounts, so the API gives each browser an anonymous **httpOnly cookie**: a random id, not a login. A **unique rule in the database** keeps it to one reaction per browser, even with double clicks. The button uses an **optimistic update**: the screen changes first, and the server's answer confirms or undoes it."
> "Comments are **moderated**: every new one is pending. They pass a hidden **honeypot**, Zod rules and **rate limits** first. They're shown as **plain text**, so nobody can inject scripts. Replies are one level deep, like YouTube."

**Then, in the admin (normal window):** the **Comments** badge shows **1** → open it → **Reply** ("Approve + publish reply") → back on the article: the comment and your reply with the **Author** badge.
> "The badge and the page share the count through a **signal in a service**: the page updates it, and the top bar follows."

📖 `docs/18` · `docs/14` §3.6 · `docs/15` §7c · `docs/16` entries 37–41

---

## 4. Admin: login and security (3 minutes)
**Show:** in the **private window**, open `/admin` → you're sent to the login page.

**Say:**
> "Visitors never even download the admin code: it's lazy-loaded behind a **`CanMatch` guard**. But the guard is only for the user interface. The real security is on the server: every admin endpoint checks the token in **`requireAdmin`**."

**Show:** log in (normal window) → **DevTools → Application → Cookies**: `access_token` and `refresh_token`, both **HttpOnly**.

**Then prove it:** in the **Console** type `document.cookie` → the tokens are **not** there. Then show a request in **Network** → its `Cookie` header **does** carry them.
> "HttpOnly: JavaScript, even an injected script, can't read the tokens, but the browser still sends them. Nothing to steal." (📖 `docs/13`, HttpOnly section)

**Say (the login flow, `docs/13`):**
> "Login gives two **httpOnly cookies**: a 15-minute **JWT access token**, and a 7-day **refresh token**, stored only as a hash and **rotated** on every use. Angular never touches the tokens, so a script can't steal them. When the access token expires, the API answers 401; my **interceptor** makes **one shared refresh** and repeats the request, and the user never notices."

📖 `docs/13` (all) · `docs/15` §6 · `docs/14` §2, §3.3

---

## 5. Admin: writing and publishing (3 minutes)
**Show:** the posts table → **New post** → type a title (the slug suggestion follows) → some Markdown (the live preview) → **Save** → the address changes to `/admin/posts/<id>` → change one field → **Save** (show the PATCH body in Network) → try to leave → **our dialog** → back to the table → **Publish** → open the blog in the private window: it's there.

**Say:**
- "One editor for create and edit: **no id → POST** the whole form, **an id → PATCH** only the changed (dirty) fields."
- "The API validates with **Zod**: one schema for create, and its `.partial()` for edit. The form's checks mirror it for quick feedback, but the API's rules are the ones that count."
- "Save never publishes; Publish is a separate decision, and the API only allows it with an excerpt and content."
- "The dialog is my own, on the native `<dialog>` element; the guard waits for its Promise."
- "Delete is a **soft delete**: the row stays, hidden everywhere."

📖 `docs/15` §7 · `docs/14` §3.4 · FAQ "schema vs controller vs service"

---

## 6. The code tour (3 minutes)
**Show:** `PROJECT_MAP.md`, then the folders.

**Frontend** (`web/src/app/`):
> "Folders by responsibility: **core** (auth, interceptor, the API address), **layouts** (page frames), **shared** (dialog, Markdown pipe, styles), and **features** (home, blog, admin), with a written rule for where each file goes."

**Backend** (`api/src/`):
> "Feature modules, each with **routes → controller → service**. Routes map URLs, the controller handles the HTTP side and validation, the service holds the business rules and talks to the database through **Prisma**. Middleware handles origin checks, auth and errors."

**Database:**
> "Users, refresh tokens, posts, and tags with a **many-to-many** link table; plus projects, experience and skills. Every change is a **Prisma migration**, applied automatically on deploy."

📖 `docs/15` §3 · `docs/14` §5 · `docs/05`

---

## 7. A bug story (1 minute)
Interviewers love this one:
> "I tested the unhappy path by stopping the API. Some sections broke instead of showing Try again. The reason: in Angular 20+, `resource.value()` **throws** in the error state, and a check above the error branch read it first. I guarded every read with `hasValue()`, and wrote my first blog post about it."

Second story, if there's time:
> "Creating the admin on the live database failed with 'Missing JWT_SECRET', because the database client imported the whole app config. I separated the database config, so scripts need only the connection string: **least privilege**."

📖 `docs/16` entry 34 · FAQ (parcel, reception desk)

---

## 8. Close: honest limits and next steps (1 minute)
> "What I'd do next: a **security review** (Helmet headers, correct 4xx codes from the error handler), **tests** for the interceptor and services, and **prerendering** so link previews show each post's title."

📖 `docs/14` §7 · `docs/15` §14

---

## Likely questions, with short answers

| Question | Short answer | Details |
|---|---|---|
| Why Express, not NestJS? | to see the request flow plainly; organised NestJS-style by hand | `docs/14` Q1 |
| Why JWT, not sessions? | no DB lookup per admin request; refresh token revocable; it was my decision after comparing | `docs/13`, `docs/14` Q11 |
| Why cookies, not localStorage? | httpOnly: scripts can't read them (XSS) | `docs/16` entry 19 |
| What if three requests get 401 at once? | one shared refresh (`shareReplay`), then all three retry | `docs/16` entry 20 |
| Is the guard your security? | no: UX only; `requireAdmin` on the API is the security | FAQ M6 Q2 |
| Signals or RxJS? | signals for state on screen; RxJS for time (debounce, retry); `toSignal` at the edge | `docs/16` entry 24 |
| Reactive Forms or Signal Forms? | Reactive (mature, consistent); Signal Forms stable since 22, I'd migrate gradually | `docs/16` entry 27 |
| How is Markdown safe? | pure pipe + `[innerHTML]` sanitizer, never bypassed | `docs/16` entry 30 |
| How do you avoid SQL injection? | Prisma sends values as parameters | `docs/14` Q8 |
| How do migrations work live? | Vercel's build runs `prisma migrate deploy` | `docs/09` |
| Why does a draft give 404? | so its existence isn't revealed | `docs/14` Q14 |
| How fast is it? | lazy areas and pages, `@defer`, `OnPush` + signals | `docs/15` Q12 |
