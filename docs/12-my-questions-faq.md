# 12 — My Questions (FAQ)

[← Docs home](README.md)

The questions I asked while building this project, with the short answers that made it click. Newest topics first inside each group. Each answer links to the page with the full details.

> Rule for this project: whenever a question comes up during development, its answer is added here.

---

## Blog (milestones 1–2)

### What did we do with `/api`? What's the point? (the "front desk")
Before, the browser visited **two addresses**: the website for the page and the API for the data. Now it only ever talks to the **website's address**. Requests starting with `/api` are forwarded to the API behind the scenes, like a front desk passing a call to the right office.
- On the laptop, the front desk is `web/proxy.conf.json` (4200 → 3000).
- Live, it's the `rewrites` in `web/vercel.json`.
- So Angular just calls `/api/skills`; `/api` is a label meaning "this is not a page, pass it to the API".

**Why:** the Blog login uses a cookie (a wristband). Browsers only trust a wristband given out by the building you're standing in. One address means the same building.
→ [09 — One address for website and API](09-deployment-and-configuration.md#one-address-for-website-and-api)

### Why did we add a Firewall rule on the website project too?
The guard used to stand at the API's door, counting visitors per IP. Now everyone reaches the API **through the front desk**, so the API may see only "the front desk" and count all visitors as one. So a guard also stands at the **website's door**, the one visitors really walk through.
→ [09](09-deployment-and-configuration.md#one-address-for-website-and-api)

### What is Vitest? Is it part of VS Code, Angular or Node?
None of them. It's an **npm package that runs tests in the terminal** (`npm test`). The web project already used it: Angular calls Vitest behind the scenes, which is how the "3 passed" appeared. The API has no Angular in between, so it calls Vitest directly. **Supertest** is a helper that acts like Postman inside a test: it sends a request into the Express app and checks the answer.
→ [08 — Testing](08-testing-and-debugging.md)

### What does the `create-admin` script do, and how does it create a user?
It's a **small cousin of `seed.ts`**: a file you run from the terminal that writes into the database through Prisma. Instead of CV data, it writes **one row** into `users` (my login). It **asks** for the email and password, so the password never sits in a file or in git. It saves only a **fingerprint** of the password (`scrypt$…`), never the password itself. Running it again with the same email resets the password.
```text
npm run create-admin → Email? Password? Again? → hashPassword() → prisma.user.upsert() → users table
```
→ [05 — E2. The create-admin script](05-database-documentation.md#e2-the-create-admin-script-apiscriptscreate-admints)

### How do I see my admin user in pgAdmin?
Database → Schemas → public → right-click **Tables → Refresh** → right-click **users → View/Edit Data → All Rows**. Or in the Query Tool: `SELECT id, email, password_hash, role FROM users;`. The `password_hash` should start with `scrypt$`, not your password.

### Why is `seed.ts` in `prisma/` but `create-admin.ts` in `scripts/`?
(`seed.ts` is in `prisma/`, **next to** `migrations/`, not inside it. `migrations/` holds only the SQL files Prisma writes.)
- `prisma/seed.ts` is **content** (projects, skills…), and Prisma may run it **automatically**, e.g. after a reset.
- `scripts/create-admin.ts` creates a **real account** with a password and asks questions. It must only run when **I** choose. `scripts/` is the usual home for such run-by-hand tools.
```text
api/prisma/   database setup (schema, migrations, seed)
api/src/      the API itself
api/scripts/  my one-off tools
```

### When I push, does Vercel create the new tables on Neon by itself?
**Yes, automatically.** On every deploy Vercel runs `vercel-build`, which includes `prisma migrate deploy`. That checks Neon's `_prisma_migrations` table, finds any new migration (e.g. `add_blog`) and runs its SQL. Nothing to do except `git push`.
- **Check:** Vercel → portfolio → Deployments → the latest is Ready, and the build log shows "Applying migration …". Then Storage → portfolio-db → Data Editor shows the tables.
- **Not automatic:** **data**. Tables are structure (migrations); rows like my admin login are data, added by hand with the script (on Neon: at go-live).
→ [09](09-deployment-and-configuration.md)

### What is an enum? What is many-to-many?
- **Enum:** a column that only accepts values from a fixed list, like a TypeScript union type: `status: 'DRAFT' | 'PUBLISHED'`. The database refuses anything else.
- **Many-to-many:** one post has many tags *and* one tag is on many posts. A third table, `post_tags`, lists the pairs.
→ [05 — Blog tables](05-database-documentation.md#blog-tables-blog-milestone-2)

### I didn't fully understand the plan. Is it OK to learn it step by step?
Yes. Each milestone prepares the next: routes (a place for pages) → one address (the cookie works) → tests (prove the rules) → tables → login → admin API → public API → admin pages → blog pages → security review → go live.

---

## Contact form, email and rate limiting

### Why do we have Resend? Is it for messaging recruiters?
No. Resend only **notifies me**: when a visitor sends the form, the API saves the message and then asks Resend to email it to my Gmail. Pressing **Reply** in Gmail goes to the visitor (`replyTo`).
→ [04 — API](04-api-documentation.md)

### Why limit messages both in the code AND in the Vercel Firewall?
- **Firewall (dashboard):** "how **fast**": more than 3 POSTs in 60 s from one computer (IP) → 429, before our API even runs. Stops bots that change email every time.
- **Code (controller):** "how **many**": the same email 3+ times in an hour, or 20 in total → 429 with our text. A safety net that protects my inbox and Resend's free quota.

### Why does Angular show the same box for both limits? Is it 409?
It's **429** ("Too Many Requests"), not 409. Angular only looks at the status code, so any 429 shows the same "too many messages" box. To tell them apart: DevTools → Network → the request → Response (the firewall's 429 has no text from us).
→ [06 — Flow 6b](06-end-to-end-data-flow.md)

### What does the WhatsApp button do?
It's just a link (`wa.me/<number>?text=…`). It doesn't go through our API, isn't saved and sends no email. WhatsApp opens with a pre-filled message.
→ [06 — Flow 6c](06-end-to-end-data-flow.md)

---

## Database and Prisma

### Why are there two databases?
The **same code** runs in two places: on my laptop it uses the **local** PostgreSQL (seen in pgAdmin), and live it uses **Neon** (seen in Vercel → Storage → Data Editor). Each has its own rows. The address comes from `DATABASE_URL`: `.env` locally, Vercel's settings live.

### What is Neon, in one line?
PostgreSQL in the cloud.

### How did the data get into the tables?
Through the **seed script**: `npm run seed` runs `prisma/seed.ts`, which clears the tables and writes my CV data through Prisma. Only `messages` (from visitors) and the Blog tables are never touched by it.
→ [05 — E. The seed script](05-database-documentation.md#e-the-seed-script-apiprismaseedts)

### I created a migration but can't see the new tables in pgAdmin.
pgAdmin doesn't refresh by itself: right-click **Tables → Refresh**.

---

## Debugging and tests

### Every request shows "CORS error" locally. What's wrong?
Usually the **API isn't running**, not a CORS setting. Start `npm run dev` in `api/`. (Since the `/api` front desk, this shows as a 500/504 "proxy error" instead.)
→ [08 — Debugging](08-testing-and-debugging.md)

### Why did the web tests time out, and what are they testing?
Experience and Skills start API requests that are **never answered** in tests, so "wait until everything is finished" (`whenStable`) waited forever. The tests now just **draw the page once** (`detectChanges`). They check that the page appears, that the headline is there and that the nav links are right.
→ [08](08-testing-and-debugging.md)

### Postman gives 404 on `/api/contact`.
The method was **GET**; it must be **POST**.

---

## Git and deployment

### Why were some files not committed?
Running `git add .` inside `web/` only stages `web/`. Always commit from the **portfolio root**.

### "Redeploy" didn't pick up my new code.
"Redeploy" on an old deployment rebuilds **that old commit**. Push again, or use the newest row in the Deployments list.
