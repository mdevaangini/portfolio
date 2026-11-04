# 13 — JWT Login: My Interview Notes

[← Docs home](README.md) · Details: [04 — Authentication](04-api-documentation.md#authentication-blog-milestone-3-jwt-since-4-nov-2026) · Questions: [12 — FAQ](12-my-questions-faq.md)

My own explanation of the login (Session B, 4 Nov 2026), rewritten in plain words and checked. Read this once before an interview.

---

## The one-minute version
When I log in, the API gives my browser **two tokens as cookies**:
- an **access token** (the "badge"): a **JWT**, valid for **15 minutes**, sent with every API call;
- a **refresh token** (the "locker key"): a random string, valid for **7 days**, used only to get a new access token.

The guard (`requireAdmin`) checks the badge **without the database**. When the badge expires, the key gets me a new badge (and a new key). Logout crosses the key out of the database.

---

## B1: the badge machine (`lib/jwt.ts`)
In B1 we built **only two functions**. Nothing used them yet.

**`signAccessToken(user)`: prints the badge.**
- It writes onto the badge: my **user id** (`sub`), **email**, **role** (`ADMIN`), **when it was issued**, and **when it expires** (15 minutes later). It also notes who made it (`issuer`) and who it's for (`audience`).
- Then it **stamps** it using **`JWT_SECRET`**.
- **What `JWT_SECRET` is:** a long random password that **only the server knows**. The stamp is calculated from the badge's content plus this secret. Only someone with the secret can make a valid stamp, so a correct stamp proves two things: **we made this badge, and nobody changed it.** Laptop and live use **different** secrets, so a leak in one place can't be used in the other. It lives only in `.env` and in Vercel, never in git.
- The result is **one long string in three parts**, separated by dots:
  1. **Header:** how it's stamped (`HS256`).
  2. **Payload:** what's printed on it (id, email, role, expiry). **Anyone can read it**: it's only encoded, not hidden. That's why no passwords or secrets go in it.
  3. **Signature:** the stamp. It's **made from** the header, payload and secret, but the secret itself is **never inside** the token.

**`verifyAccessToken(token)`: the guard reads the badge.**
- It recalculates the stamp with `JWT_SECRET`. Does it match? Has the badge **not expired**? Was it made **by us, for us** (issuer/audience)? Is the role **ADMIN**?
- All yes → it returns the user printed on it (`{ id, email, role }`). Anything wrong → `null`.
- The **`jose` library** does the checking; we only read its answer. (Signing is security code you never write yourself.)

**Where the refresh token comes from:** it did **not** exist in B1. It was added in **B2**, by `createRefreshToken()` in `lib/refresh-token.ts`. It's just a long random string, and only its fingerprint is saved in the database. It has nothing to do with the two JWT functions.

---

## B2: using the tokens

### Login (`POST /api/auth/login`)
1. I send my email and password.
2. The API checks the password against the stored fingerprint in `users`, same as before. Wrong → 401. 5 wrong tries in a row → locked for 15 minutes.
3. If it's right, **`issueTokens(user)`** in `auth.service.ts` does two things:
   - `signAccessToken(user)` → **prints a new badge**;
   - `createRefreshToken()` → **cuts a new locker key**, and writes the key's **fingerprint** in reception's **book** (the `refresh_tokens` table).
4. The response gives both tokens to the browser **in its headers**, as two `Set-Cookie` lines. The **body** only says who logged in: `{ "user": { "id": 1, "email": "…", "role": "ADMIN" } }`. The tokens are **never in the body**, so page scripts (even Angular) can't read them.

### Why each cookie has a "path"
- **What:** when the server sets a cookie, it also says **which addresses the browser may send it to**. That's the cookie's `path`, set in `auth.controller.ts`.
- **How:** the browser attaches a cookie only to requests whose address **starts with** that path. It does this by itself.
- **Why:** each token should travel **only where it's needed**.

| Cookie | Holds | Lives | path | The browser attaches it to |
|---|---|---|---|---|
| `access_token` | the badge (JWT) | 15 min | `/api` | **every** `/api/...` call: admin calls, `/api/auth/me`, and also skills, projects and so on (those simply ignore it) |
| `refresh_token` | the locker key | 7 days | `/api/auth` | **only** `/api/auth/...`, i.e. `/refresh` and `/logout` (login and `/me` also receive it but ignore it) |

The 7-day key is the powerful one, so it travels as little as possible. The badge goes everywhere, but it dies in 15 minutes.

**The browser** stores both cookies and attaches them automatically. **The server** is the one that *sets* them (`Set-Cookie`). **Angular** does nothing with them.

### `requireAdmin`: the guard at the admin door
- It stands in front of **every `/api/admin/...` request**.
- It reads the **badge** (`access_token` cookie) and calls **`verifyAccessToken`**: real stamp? not expired? ADMIN?
- Yes → it lets the request through and passes the user on (`res.locals.user`). No → **401 "Not logged in."**, and the admin code never runs.
- **No database lookup:** everything it needs is printed on the badge. It never looks at the refresh token.

### `/me`: "who am I?"
It does the same badge check as the guard (no database) and answers 200 `{ user }` or 401. Angular will use it when the admin page opens.

### Refresh (`POST /api/auth/refresh`)
When the badge has expired, the browser sends the **locker key** (it's the only place that cookie goes). Then `refresh()` in `auth.service.ts`:
1. finds the key's fingerprint in the book;
2. **crosses it out** (deletes the row);
3. if it was still valid, calls `issueTokens` → **new badge + new key**, set as cookies again.

This is **rotation**: each key works **once**. A key that isn't in the book (already used, logged out, or expired) → **401 "Please log in again"**, and both cookies are cleared.

**Who calls it?** Today, only me, by hand in Postman. In **Milestone 6**, an **Angular interceptor** will do it automatically: when an admin call gets 401, call `/refresh` once and retry; if that fails too, go to the login page.

### Logout (`POST /api/auth/logout`)
It crosses the key out of the book and tells the browser to delete both cookies → **204**.

The badge can't be cancelled, so it simply expires within 15 minutes. That's exactly why it's short-lived.

---

## What each file does now

| File | Its job |
|---|---|
| `lib/jwt.ts` (B1) | The badge machine: `signAccessToken` (print) and `verifyAccessToken` (check) |
| `lib/refresh-token.ts` (B2, renamed from `session-token.ts`) | Cuts the locker key (a random string) and makes its fingerprint |
| `schema.prisma` | The table `sessions` became **`refresh_tokens`** (reception's book): key fingerprint, whose key, expiry. **The badge is stored nowhere**; that's the point of a badge |
| `auth.service.ts` (reception) | `issueTokens` (new badge + new key), `login` (password check + lockout, then `issueTokens`), `refresh` (rotation), `logout` (cross the key out) |
| `auth.controller.ts` | Puts the tokens into the two cookies and reads them back. Endpoints: **login** (both cookies → 200 `{user}`), **refresh** (new pair → 200, or 401 + cookies cleared), **me** (badge only), **logout** (→ 204) |
| `auth.routes.ts` | + `POST /refresh` |
| `middleware/require-admin.ts` | The guard: `verifyAccessToken` on the badge. No database |
| `admin.controller.ts` | The user's details now come from the badge |
| `scripts/create-admin.ts` | A password reset now crosses out **all** my keys, so every browser must log in again |

---

## How I tested it in Postman

| # | Request | Expect |
|---|---|---|
| 1 | `POST /api/auth/login` (right password) | 200. **Headers** tab: two `Set-Cookie` lines, `access_token` and `refresh_token` |
| 2 | `GET /api/admin/check` | 200 "You are the admin" |
| 3 | `POST /api/auth/refresh` | 200 (new badge + new key). In pgAdmin, `refresh_tokens` still has 1 row, but a **different** one |
| 4 | `POST /api/auth/logout` | 204. The row is gone from `refresh_tokens` |
| 5 | `GET /api/admin/check` again | 401 |

---

## The interview line
> *"I used a short-lived JWT access token (15 minutes) plus a rotating refresh token (7 days), both in httpOnly, sameSite-strict cookies. The access token is checked by its signature, with no database, but it can't be revoked, so it's short. The refresh token is stored only as a hash, so it can be revoked at logout, and each one works only once."*

---

## What I got wrong at first (so I don't mix it up again)
1. **`JWT_SECRET` isn't "for uniqueness".** It's the **secret key that makes the stamp**. A correct stamp proves we made the badge and nobody changed it.
2. **The signature isn't the secret "at the end".** It's **calculated from** the content plus the secret, and the secret never appears in the token.
3. **The refresh token wasn't part of B1.** It came in **B2** (`createRefreshToken`).
4. **Login and `Set-Cookie` are B2, not B1.** B1 was only the two functions.
5. **The browser doesn't set the cookies; the server does** (`Set-Cookie`). The browser **stores** and **attaches** them.
6. **The refresh token is not used by `requireAdmin` or `/me`.** They check the **access token**. The refresh token (path `/api/auth`) is only for `/refresh` and `/logout`.
7. **`issueTokens` uses `signAccessToken` and `createRefreshToken`**, not "refresh access token". And it prints a **badge**, not a "batch".
