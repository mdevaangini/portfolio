# 10 — Security and Maintenance

[← 09 Deployment](09-deployment-and-configuration.md) · [Docs home](README.md) · Next: [11 — Glossary](11-glossary-for-beginners.md)

Each item is marked as a ✅ **verified protection**, a ⚠️ **risk or gap**, or a 📝 **recommendation**.

## Implemented protections

| Control | Protects against | Where | Status |
|---|---|---|---|
| Secrets in `.env`, not in code | Leaking the DB password via git | `api/.env`; root and api `.gitignore` list `.env` | ✅ |
| Live secrets only in Vercel's settings (marked *Sensitive*); the laptop copy is in git-ignored `api/.env.production.local` | Leaking the Neon password | Vercel → Environment Variables | ✅ |
| HTTPS everywhere | Messages and data read in transit | Vercel `.vercel.app` domains | ✅ |
| Private GitHub repository | The CV PDF (contains a phone number) being public | GitHub settings | ✅ |
| `.env.example` with placeholders only | Sharing setup info without secrets | `api/.env.example` | ✅ |
| Required-setting check at start-up | Running with a broken config | `api/src/config/env.ts` | ✅ |
| Input validation (`limit`, `offset`, `id`) | Nonsense or huge requests reaching the DB | `projects.controller.ts` | ✅ |
| Contact form validation on the server (required, email format, max lengths) | Junk or oversized messages; never trusting the browser | `contact.controller.ts` | ✅ |
| Column length limits (`varchar(100/254/2000)`) | Oversized data even if a check is missed | `messages` table | ✅ |
| Spam trap field (`website`) | Simple bots filling every field | contact form + controller | ✅ |
| Notification email is plain text; visitor input never becomes HTML | Links/scripts injected into the owner's inbox | `contact.email.ts` | ✅ |
| Resend key only in `.env` and Vercel settings | Others sending email in the owner's name | `.gitignore`, Vercel | ✅ — **never show `.env` in screenshots**; if a key is exposed, delete it in Resend and create a new one |
| Contact reply returns only `id` + `createdAt` | Echoing data back unnecessarily | `contact.service.ts` | ✅ |
| `limit` capped at 50 | Requests for millions of rows | `projects.controller.ts` | ✅ |
| Parameterised queries via Prisma | **SQL injection** (values are never pasted into SQL text) | `projects.service.ts` | ✅ |
| Generic 500 message; full error only in the server log | Leaking SQL, file paths or stack traces to visitors | `middleware/error-handler.ts` | ✅ |
| CORS restricted to one origin | Other websites reading the API from a visitor's browser | `app.ts` | ✅ |
| Public write endpoint can only **add** messages; every other change lives under `/api/admin` | Visitors changing or deleting content | `POST /api/contact`; `/api/admin` | ✅ |
| **Admin guard** `requireAdmin` in front of every `/api/admin` route (valid session + `ADMIN`, else 401; the route code never runs) | Anyone calling admin endpoints directly (Postman, scripts), not just hidden buttons | `middleware/require-admin.ts`, `admin.routes.ts` | ✅ Blog M3 |
| Passwords stored only as **scrypt** fingerprints (random salt); compared with `timingSafeEqual` | A database leak revealing passwords | `lib/password.ts` | ✅ |
| Session tokens: 32 random bytes; only the **SHA-256 fingerprint** stored; 7-day expiry | A database leak giving working logins | `lib/session-token.ts`, `sessions` table | ✅ |
| Login cookie `httpOnly`, `secure` (live), `sameSite=strict`, `path=/api` | Scripts stealing it; sniffing; other sites using my login (CSRF) | `auth.controller.ts` | ✅ |
| **Origin check** on POST/PATCH/DELETE to `/auth` and `/admin` → 403 from other websites | CSRF (second lock next to `sameSite`) | `middleware/check-origin.ts` | ✅ |
| Lockout: 5 wrong passwords → 15 minutes (429); same 401 message for unknown email and wrong password; equal timing | Password guessing; finding out which emails have an account | `auth.service.ts` | ✅ |
| No sign-up page: users only via `npm run create-admin` | Strangers creating accounts | `scripts/create-admin.ts` | ✅ |
| Website and API on **one address** (`/api` rewrite) | Needed for the cookie to be first-party and `sameSite` to work | `web/vercel.json`, `web/proxy.conf.mjs` | ✅ Blog M1 |
| Phone number not shown on the site | Spam | design decision (note: it is inside the downloadable CV PDF — the owner's choice) | ✅ |

## Risks and gaps

| Item | Note | Status |
|---|---|---|
| Database connects as the `postgres` superuser (local) / Neon's owner role (live) | Too powerful in principle; acceptable for a portfolio | ⚠️ |
| Rate limiting, layer 1: **Vercel Firewall** rule on `POST /api/contact` — max 3 per 60 s per IP | Bots flooding the form from one address; blocked before the API runs | Vercel → **devaangini** → Firewall (the website, which visitors really reach since the `/api` rewrite) + the older copy on portfolio | ✅ (dashboard setting, not in git) |
| *(How the two layers work together, with examples: [06 — Flow 6b](06-end-to-end-data-flow.md#flow-6b--too-many-messages-rate-limiting-two-layers))* | | | |
| Rate limiting, layer 2: **code** — max 3 per email and 20 in total per hour → 429 | Floods that change email or come from many IPs; protects the inbox and Resend's 100/day | `contact.controller.ts` | ✅ |
| Messages are stored with the sender's email | Personal data the owner is responsible for | ⚠️ — keep the DB private; delete old messages |
| No security headers (e.g. via Helmet) | Missing hardening headers | ⚠️ |
| Lockout can be triggered by someone else (5 wrong guesses lock **me** out for 15 min) | Annoying, not dangerous; wait, or re-run `create-admin` to unlock | ⚠️ accepted |
| `CORS_ORIGIN` doubles as the allowed Origin for logins | If the live website address changes and `CORS_ORIGIN` isn't updated, live logins get 403 | ⚠️ check at Blog go-live |
| Backups | Neon keeps restore history on its free plan (check current limits); the seed can rebuild all content except `messages` | ⚠️ |
| CORS errors are browser-only protection | CORS doesn't stop non-browser clients; that's expected because the data is public | — |

## Recommendations 📝

1. Commit regularly from the `portfolio/` root; never commit `.env`.
2. In production, use a dedicated database user with only the needed permissions.
3. ~~Add rate limiting to the live `POST /api/contact`~~ ✅ done (firewall + code).
4. Add security headers (e.g. Helmet) to the API; HTTPS is already provided by Vercel.
5. Back up the production database (most managed providers offer this).
6. Keep dependencies updated: `npm outdated` and `npm audit` in both projects. Note that Prisma 7 is pinned on purpose; Prisma 8 changes the APIs.

## Maintenance routines

| Task | How |
|---|---|
| Update the CV | Replace `web/public/Devaangini-Mehta-CV.pdf`, keeping the same file name |
| Edit projects, experience or skills | Change the arrays in `api/prisma/seed.ts` → `npm run seed` (no migration) |
| Read contact messages | pgAdmin: `SELECT * FROM messages ORDER BY created_at DESC;` |
| Change the photo | Replace `web/public/headshot.jpg` (square, ~600×600) |
| Add a column/table | `schema.prisma` → `npx prisma migrate dev --name …` → `npx prisma generate` |
| Check migration state | `SELECT * FROM _prisma_migrations;` |
| Keep docs current | Update `docs/` and `SESSION_CONTEXT.txt` after each feature |
| New file | Start it with an "ABOUT THIS FILE" comment, like the others |
