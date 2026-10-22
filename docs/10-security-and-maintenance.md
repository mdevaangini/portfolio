# 10 — Security and Maintenance

[← 09 Deployment](09-deployment-and-configuration.md) · [Docs home](README.md) · Next: [11 — Glossary](11-glossary-for-beginners.md)

Each item is marked as a ✅ **verified protection**, a ⚠️ **risk or gap**, or a 📝 **recommendation**.

## Implemented protections

| Control | Protects against | Where | Status |
|---|---|---|---|
| Secrets in `.env`, not in code | Leaking the DB password via git | `api/.env`; root and api `.gitignore` list `.env` | ✅ |
| Private GitHub repository | The CV PDF (contains a phone number) being public | GitHub settings | ✅ |
| `.env.example` with placeholders only | Sharing setup info without secrets | `api/.env.example` | ✅ |
| Required-setting check at start-up | Running with a broken config | `api/src/config/env.ts` | ✅ |
| Input validation (`limit`, `offset`, `id`) | Nonsense or huge requests reaching the DB | `projects.controller.ts` | ✅ |
| Contact form validation on the server (required, email format, max lengths) | Junk or oversized messages; never trusting the browser | `contact.controller.ts` | ✅ |
| Column length limits (`varchar(100/254/2000)`) | Oversized data even if a check is missed | `messages` table | ✅ |
| Spam trap field (`website`) | Simple bots filling every field | contact form + controller | ✅ |
| Contact reply returns only `id` + `createdAt` | Echoing data back unnecessarily | `contact.service.ts` | ✅ |
| `limit` capped at 50 | Requests for millions of rows | `projects.controller.ts` | ✅ |
| Parameterised queries via Prisma | **SQL injection** (values are never pasted into SQL text) | `projects.service.ts` | ✅ |
| Generic 500 message; full error only in the server log | Leaking SQL, file paths or stack traces to visitors | `middleware/error-handler.ts` | ✅ |
| CORS restricted to one origin | Other websites reading the API from a visitor's browser | `app.ts` | ✅ |
| Only one write endpoint, and it can only **add** messages | Visitors changing or deleting content | `POST /api/contact` | ✅ |
| Phone number not shown on the site | Spam | design decision | ✅ |

## Risks and gaps

| Item | Note | Status |
|---|---|---|
| Database connects as the `postgres` superuser | Fine locally; too powerful for production | ⚠️ |
| No rate limiting | Someone could send thousands of contact messages | ⚠️ — add before deploying |
| Messages are stored with the sender's email | Personal data the owner is responsible for | ⚠️ — keep the DB private; delete old messages |
| No security headers (e.g. via Helmet) | Missing hardening headers | ⚠️ |
| No authentication | Fine today; required before any admin page (e.g. reading messages on the site) | — |
| No database backups configured | Local data could be lost | ⚠️ |
| CORS errors are browser-only protection | CORS doesn't stop non-browser clients; that's expected because the data is public | — |

## Recommendations 📝

1. Commit regularly from the `portfolio/` root; never commit `.env`.
2. In production, use a dedicated database user with only the needed permissions.
3. Before deploying: add rate limiting to `POST /api/contact` (e.g. a few messages per minute per visitor).
4. Add security headers and HTTPS on the hosted API.
5. Back up the production database (most managed providers offer this).
6. Keep dependencies updated: `npm outdated` and `npm audit` in both projects. Note that Prisma 7 is pinned on purpose; Prisma 8 changes the APIs.

## Maintenance routines

| Task | How |
|---|---|
| Update the CV | Replace `web/public/Devaangini-Mehta-CV.pdf`, keeping the same file name |
| Edit project text | `npx prisma studio` or SQL `UPDATE` (data change, no migration) |
| Edit experience or skills | Change the arrays in `api/prisma/seed.ts` → `npm run seed` |
| Read contact messages | pgAdmin: `SELECT * FROM messages ORDER BY created_at DESC;` |
| Change the photo | Replace `web/public/headshot.jpg` (square, ~600×600) |
| Add a column/table | `schema.prisma` → `npx prisma migrate dev --name …` → `npx prisma generate` |
| Check migration state | `SELECT * FROM _prisma_migrations;` |
| Keep docs current | Update `docs/` and `SESSION_CONTEXT.txt` after each feature |
| New file | Start it with an "ABOUT THIS FILE" comment, like the others |
