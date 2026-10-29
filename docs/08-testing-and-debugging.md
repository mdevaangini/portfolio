# 08 — Testing and Debugging

[← 07 Local setup](07-local-setup-and-development.md) · [Docs home](README.md) · Next: [09 — Deployment](09-deployment-and-configuration.md)

## Current state of automated tests

| Project | Framework | Tests | Status |
|---|---|---|---|
| `web/` | Angular unit-test builder (`@angular/build:unit-test`) with **Vitest** + jsdom | 3 tests. `app.spec.ts`: the app is created; the nav shows exactly `01. expertise`, `02. work`, `03. experience`, `04. skills`. `pages/home/home.spec.ts`: the `<h1>` contains "I build Angular apps" | ✅ passing (`npm test`) |
| `api/` | **Vitest** (runs the tests) + **Supertest** (sends fake HTTP requests into the Express `app`, like Postman inside a test) | `tests/app.test.ts`: 5 tests — unknown route → 404 JSON; contact: empty → 400 with 3 fields, bad email → 400 (email only), message > 2000 → 400, spam field → 201 `{ ok: true }` + login without email/password or with non-text values → 400, no cookie; `/me` without cookie → 401; logout without cookie → 204 + cookie cleared; **`/api/admin/check` without cookie → 401**; login from another website → **403**, from `localhost:4200` → passes; a GET from another website isn't blocked. `tests/password.test.ts`: 4 tests — the password is never stored, right ✓ / wrong ✗, random salt, invalid stored value ✗. **17 in total** | ✅ passing (`npm test`, 2026-10-29) |

**Vitest in one line:** an npm package that runs tests in the terminal. The web project uses it too: Angular calls it behind the scenes. The API has no Angular in between, so it calls Vitest directly (`api/vitest.config.ts`).

**API tests never touch a database.** `vitest.config.ts` gives them a fake `DATABASE_URL` and doesn't load `.env`. These tests only check what happens *before* the database. Tests that need data (a real login, blog posts) need a separate **test database**, so they never touch my real data. Proposed after Blog milestone 3: a local `portfolio_test` database used only by tests.

The web tests use `provideHttpClientTesting()` so no real request leaves the test, and `DeferBlockBehavior.Manual` so the deferred Projects section stays on its placeholder. Because Experience and Skills start requests that are **never answered** in tests, the tests call `fixture.detectChanges()` (draw once) instead of `await fixture.whenStable()` (which would wait forever and time out after 5 s). These are smoke tests: they don't check any data yet. When nav items or the headline change, update the expectations in `app.spec.ts`.

### 📝 Recommended next tests (not implemented)

- **web**: `ProjectsService` with `HttpTestingController` (URL and `category` param); the Contact form (invalid form sends nothing; a 400 puts messages under fields; 201 shows "Thanks").
- **api**: more checks before the database, e.g. `GET /api/projects?limit=abc` → 400. Login and admin permissions arrive with the Blog (milestones 3–5).

## Manual test checklist

| # | Action | Expected |
|---|---|---|
| 1 | `GET /api/projects` | 200, all projects, `total` = row count |
| 2 | `GET /api/projects?limit=2` | 2 items, `total` unchanged |
| 3 | `GET /api/projects?limit=2&offset=2` | Remaining items |
| 4 | `GET /api/projects?title=pay` | Only titles containing "pay" |
| 5 | `GET /api/projects?category=lending` | Lending only (case ignored) |
| 6 | `GET /api/projects?category=Travel` | `data: []`, `total: 0` |
| 7 | `GET /api/projects?limit=abc` | **400** |
| 8 | `GET /api/projects/categories` | Sorted list of categories |
| 9 | `GET /api/projects/<an id from the list>` / `/999` / `/abc` | 200 / **404** / **400** |
| 10 | `GET /api/hello` | **404** route not found |
| 11 | Web: scroll to *Selected work* | Skeleton briefly, then cards and chips |
| 12 | Web: click a chip | Cards dim, then filter; Network tab shows `?category=…` |
| 13 | Web: stop the API, reload | Error states with *Try again* (projects, experience, skills) |
| 14 | `GET /api/experience` | 3 jobs, Happiest Minds first, `endDate: null` |
| 15 | `GET /api/skills` | 6 groups, each with a `skills` list |
| 16 | **POST** `/api/contact` with a valid JSON body | **201** and a new row in `messages` |
| 17 | **POST** `/api/contact` with `{ "name": "", "email": "abc" }` | **400** with three `fields` messages |
| 18 | **POST** `/api/contact` with a valid body + `"website": "spam.com"` | 201 but **no** new row |
| 19 | Web: click *Send message* with empty fields | Red messages, nothing sent (Network tab stays empty) |
| 20 | Web: send a real message | "Thanks, your message was sent." + new row + email in Gmail (check Spam the first time) |
| 21 | API terminal (or Vercel → Logs) after sending | `[email] sent to … (id …)` |
| 22 | Send 4 messages with the **same** email within an hour | 4th → **429**, "You've sent several messages…" box, no row, no email |
| 23 | Live: send 4 messages within 60 s with **different** emails | 4th blocked by the Vercel Firewall (429 or 403) |

Open URLs in the browser or use **Postman**. Check status codes in the browser's **Network** tab (F12).

## How to verify database operations

- pgAdmin → Query Tool on `portfolio`: `SELECT * FROM projects ORDER BY display_order;`, `SELECT * FROM messages ORDER BY created_at DESC;`
- After `npm run seed`: `SELECT g.name, s.name FROM skills s JOIN skill_groups g ON g.id = s.group_id;` shows each skill next to its group.
- `npx prisma studio` to see the same rows through Prisma.
- `SELECT * FROM _prisma_migrations;` lists which migrations are applied.

## Debugging walkthrough: "projects don't appear"

Work from the screen backwards, one layer at a time:

1. **Browser → Network tab (F12)**, filter *Fetch/XHR*, reload, find `projects`.
   - **No request at all?** You haven't scrolled to the section (it's `@defer on viewport`), or there's an Angular error: check the **Console** tab.
   - **Status "CORS error" or "(failed)"?** The API is unreachable or not allowing `localhost:4200`. Go to step 2.
   - **Status 400?** Read the response body, which names the bad parameter.
   - **Status 500?** Go to step 3.
   - **Status 200 but `data: []`?** The query worked but found nothing. Go to step 4.
2. **Is the API running?** Open `http://localhost:3000/api/projects` directly. If it doesn't load, start it with `npm run dev`. If it loads here but the site shows a CORS error, check `CORS_ORIGIN` and that only one process is on port 3000.
3. **API terminal.** `error-handler.ts` prints `[error] GET /api/projects` followed by the real error. Common causes: wrong password in `DATABASE_URL`, PostgreSQL not running, or a stale Prisma client after a schema change (`npx prisma generate`).
4. **Database.** In pgAdmin, `SELECT * FROM projects;`. If there are no rows, add data. If you filtered by category, check the spelling of the `category` values.

### "CORS error" on every request

If **all** requests (projects, skills, experience, contact) fail, the API is simply **not running** (or crashed / port 3000 is busy). Since Blog milestone 1 the browser calls `localhost:4200/api/…`, so this now shows as **500/504** with "proxy error" in the `npm start` terminal (before, it showed "CORS error"). Open `http://localhost:3000/api/skills` directly; if it doesn't load, restart `npm run dev`. A real CORS-setting problem shows a response with missing `Access-Control-Allow-Origin`.

### No notification email

Look for the `[email]` line: `skipped` → `RESEND_API_KEY`/`NOTIFY_EMAIL` not set (live: add them in Vercel and redeploy); `failed: …` → the reason is in the text; `sent` → check Gmail's Spam/Promotions. Resend → **Emails** shows every email it sent.

### Useful HTTP status codes here

| Code | Meaning in this project |
|---|---|
| 200 | Success |
| 201 | Created: a contact message was saved |
| 400 | Your request is wrong (bad `limit`, `offset`, `id`, or form fields) |
| 404 | Unknown route, wrong method (e.g. GET on `/api/contact`), or a project id that doesn't exist |
| 500 | Server-side failure; read the API terminal |

### Logs and tools

- **API terminal**: start-up message and every 500 error with its stack.
- **Browser DevTools**: *Network* (requests, status, response body), *Console* (Angular errors).
- **pgAdmin / Prisma Studio**: the actual data.
