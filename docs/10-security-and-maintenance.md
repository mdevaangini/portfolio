# 10 — Security and Maintenance

[← 09 Deployment](09-deployment-and-configuration.md) · [Docs home](README.md) · Next: [11 — Glossary](11-glossary-for-beginners.md)

Each item is marked as a ✅ **verified protection**, a ⚠️ **risk or gap**, or a 📝 **recommendation**.

## Implemented protections

| Control | Protects against | Where | Status |
|---|---|---|---|
| Secrets in `.env`, not in code | Leaking the DB password via git | `api/.env`, `api/.gitignore` (lists `.env`) | ✅ |
| `.env.example` with placeholders only | Sharing setup info without secrets | `api/.env.example` | ✅ |
| Required-setting check at start-up | Running with a broken config | `api/src/config/env.ts` | ✅ |
| Input validation (`limit`, `offset`, `id`) | Nonsense or huge requests reaching the DB | `projects.controller.ts` | ✅ |
| `limit` capped at 50 | Requests for millions of rows | `projects.controller.ts` | ✅ |
| Parameterised queries via Prisma | **SQL injection** (values are never pasted into SQL text) | `projects.service.ts` | ✅ |
| Generic 500 message; full error only in the server log | Leaking SQL, file paths or stack traces to visitors | `middleware/error-handler.ts` | ✅ |
| CORS restricted to one origin | Other websites reading the API from a visitor's browser | `app.ts` | ✅ |
| Read-only API | No data can be changed through the website | all endpoints are `GET` | ✅ |
| Phone number not shown on the site | Spam | design decision | ✅ |

## Risks and gaps

| Item | Note | Status |
|---|---|---|
| `api/` not under version control | No history, no backup of the code | ⚠️ |
| `web/` changes uncommitted | Only the initial commit exists | ⚠️ |
| Database connects as the `postgres` superuser | Fine locally; too powerful for production | ⚠️ |
| No rate limiting | A flood of requests could load the DB | ⚠️ (low risk locally) |
| No security headers (e.g. via Helmet) | Missing hardening headers | ⚠️ |
| No authentication | Correct today (read-only); required before any admin/write feature | — |
| No database backups configured | Local data could be lost | ⚠️ |
| CORS errors are browser-only protection | CORS doesn't stop non-browser clients; that's expected because the data is public | — |

## Recommendations 📝

1. Put `api/` under git (or one repository at `portfolio/`) and commit regularly; never commit `.env`.
2. In production, use a dedicated database user with only the needed permissions.
3. Before adding the contact form (the first write endpoint): validate and size-limit the body, add rate limiting, and consider spam protection.
4. Add security headers and HTTPS on the hosted API.
5. Back up the production database (most managed providers offer this).
6. Keep dependencies updated: `npm outdated` and `npm audit` in both projects. Note that Prisma 7 is pinned on purpose; Prisma 8 changes the APIs.

## Maintenance routines

| Task | How |
|---|---|
| Update the CV | Replace `web/public/Devaangini-Mehta-CV.pdf`, keeping the same file name |
| Edit project text | `npx prisma studio` or SQL `UPDATE` (data change, no migration) |
| Add a column/table | `schema.prisma` → `npx prisma migrate dev --name …` → `npx prisma generate` |
| Check migration state | `SELECT * FROM _prisma_migrations;` |
| Keep docs current | Update `docs/` and `SESSION_CONTEXT.txt` after each feature |
