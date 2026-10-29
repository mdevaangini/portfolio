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

### My own summary of the login flow (checked ✓)
1. I enter email + password on the login page; Angular sends them to the **login API** (`POST /api/auth/login`).
2. The **backend** fingerprints the password and compares it with `users.password_hash`. No match → 401, nothing else happens.
3. Match → the backend makes a random **token**, stores its **fingerprint** in `sessions.token_hash`, and sends the token back **in the `Set-Cookie` response header** (not in the JSON).
4. The **browser** stores the token as a **cookie** and attaches it to every later `/api` request by itself.
5. On each admin request, the backend **fingerprints the cookie** and looks for that fingerprint in `sessions` (and checks it hasn't expired). Found → it's an admin request and it's allowed. Not found → 401.

The password is checked once (step 2); after that, only the cookie is checked (step 5).

**If the cookie doesn't match (step 5 fails):** the API just answers **401 "Not logged in."** Nothing is deleted from `sessions`: there's no matching row to delete. `/me` also tells the browser to throw away the useless cookie. Rows are deleted only by **logout** (my own row) and by the clean-up of **expired** sessions at the next login.

### Who attaches the cookie: the API or the browser?
Both, but in **different directions** and with **different headers**:

| Direction | Who writes it | Header | When |
|---|---|---|---|
| API → browser (**response**) | the **API** (`res.cookie(...)`) | `Set-Cookie: session=abc123` | **Once**, in the login response (and in the logout response, to delete it) |
| Browser → API (**request**) | the **browser**, automatically | `Cookie: session=abc123` | On **every** later `/api` request |

```text
Login:   browser ──request──▶ API          browser ◀──response + Set-Cookie── API   (API gives it, once)
Later:   browser ──request + Cookie──▶ API   browser ◀──response (no cookie)── API   (browser shows it, every time)
```

The API does **not** add the cookie to every response; it gave it once. After that, the browser carries it **on the way to** the API. Like a cinema: the counter gives you a ticket once; afterwards you show it at the door each time.

**See it yourself:** DevTools → Network → click the login request → **Response Headers** has `Set-Cookie`. Click any later request (e.g. `me`) → **Request Headers** has `Cookie`.

### Is step 3b where the cookie is stored in the request headers?
**No.** Storing the cookie and attaching it to request headers is done by the **browser on its own**; no code of ours does that, in any step. Our code only runs on the **API side**:

| Step | Our code (API) | Direction |
|---|---|---|
| 3a | **Gives** the cookie: `res.cookie(...)` → `Set-Cookie` in the login response | API → browser |
| 3b | **Reads** the cookie the browser sent: `cookieParser()` turns the `Cookie` request header into `req.cookies`; then `/me` (whose card is this?) and `/logout` (delete the card) | browser → API |
| 3c | **Guards** admin routes with the same reading + checking, before any admin code runs | browser → API |

### Why do we need the cookie-parser package?
Express can **write** a cookie by itself (`res.cookie`, 3a) but can't **read** one. The browser sends the cookie back as one plain text header, `Cookie: session=abc123; other=…`. **cookie-parser** splits that text into an object, `req.cookies = { session: "abc123" }`, so the code can just use `req.cookies.session`. It's the cookie version of `express.json()` filling `req.body`. The value it reads is the same token the API sent at login; it just comes back **through the request**, carried by the browser.

### What is the login cookie, and what do its 4 safety settings mean? (milestone 3)
After a correct login, the API gives the browser a **hotel key card**: a cookie named `session`. The browser carries it and shows it automatically with every `/api` request, so I don't type my password again for 7 days. The 4 settings are **rules for how the browser carries the key card**:

| Setting | Hotel picture | Plain meaning | Protects against |
|---|---|---|---|
| `httpOnly` | The card is in a **sealed pocket**: it can be tapped on the door, but nobody can take it out to look at it | JavaScript on the page (even Angular) can't read it; the browser only *sends* it | A bad script copying my card |
| `secure` | Only use the card in **closed corridors**, never shouted across the lobby | Only sent over **https** (encrypted). Off on the laptop because localhost is plain http | Someone on the Wi-Fi seeing it |
| `sameSite: strict` | The card only works if **I** walk to the door myself, not if a stranger pushes me there | Only sent when the request starts **from my own site**. A trick button on another website gets no card | Another site making my browser do things as me (e.g. delete a post) |
| `path: /api` | Only tap it at **my room's door**, not at the restaurant or the pool | Only sent to `/api/...`, not with pages, images or the CV | Showing it more often than needed |

Angular doesn't handle the cookie at all: the browser stores and sends it by itself.

### Do I get the cookie in the login response and send it with every request myself?
**Almost.** The idea is right: login gives a cookie, and every later request carries it so the API knows "this is the admin". Two corrections:

1. **It's not in the JSON body.** The login reply body is only `{ "user": { id, email } }`. The cookie arrives in a **response header**, `Set-Cookie: session=…`. The browser sees that header and stores the cookie by itself.
2. **I don't send it; the browser does.** On every later `/api/...` request, the browser adds a `Cookie: session=…` header **automatically**. My Angular code never touches it (it can't even read it: `httpOnly`).

```text
LOGIN    Angular ──POST /api/auth/login {email, password}──▶ API
         Angular ◀── body: { user }   header: Set-Cookie: session=abc ── API
                     (the browser quietly stores session=abc)

LATER    Angular ──GET /api/auth/me──▶ browser adds "Cookie: session=abc" ──▶ API
         API: fingerprint of abc → found in sessions → "this is the admin" ✓
```

**Compared with what I know from work (token + interceptor):** there, the token comes in the JSON body, Angular saves it (e.g. in localStorage), and an **HttpInterceptor** adds `Authorization: Bearer …` to every request. With a cookie, **the browser is the interceptor**: storing and attaching happen by themselves. That's also why a bad script can't steal it: it never sits anywhere JavaScript can read.

### Does the UI need to set the cookie header?
**No. The UI sets nothing.**
- **Backend:** `res.cookie("session", token, …)` in `auth.controller.ts` writes the `Set-Cookie` response header.
- **Browser:** saves the cookie and adds the `Cookie` request header to every later `/api` call.
- **Angular:** just calls `http.post('/api/auth/login', …)` and `http.get('/api/auth/me')` as usual. No interceptor, no header, no localStorage.

Why not even `withCredentials: true`? That's only needed when the API is on a **different address**. Thanks to the "front desk" (milestone 1), the website and API share one address, so the browser sends the cookie by default.

### Is the cookie compared with my password on every request?
**No.** There are two different fingerprints, used at two different moments:

| Fingerprint | Stored in | Checked | Against |
|---|---|---|---|
| `password_hash` | `users` | **Once**, at login | the password I type |
| `token_hash` | `sessions` | On **every** admin request | the cookie the browser attaches |

After login, the password is never used again until the next login. The cookie (key card) replaces it.

```text
Login (once):  password ──fingerprint──▶ compare with users.password_hash ──✓──▶ new sessions row + cookie
Each request:  cookie   ──fingerprint──▶ look up sessions.token_hash ──found & not expired──▶ allowed
                                                                    └─not found / expired──▶ 401
```

- `/me` is just **one** endpoint that runs this check and says "who am I". Every admin endpoint (create/edit/delete post) runs the **same check** through a guard, `requireAdmin` (milestone 3c), before its own code.
- When the check fails, the API answers **401 "Not logged in."** It doesn't log anyone out; it simply refuses. Angular will then send me to the login page (milestone 6).
- Real **logout** is a separate request (`/api/auth/logout`) that deletes the `sessions` row.

### Is the cookie the same as `token_hash`?
**No: the cookie holds the token; the database holds the token's fingerprint (`token_hash`).** They're two different strings.

```text
At login the API makes a random token:   abc123            (example; really ~43 random characters)
  → browser gets (cookie):               session=abc123
  → database stores (sessions.token_hash): 9f2e7c…           = SHA-256 fingerprint of abc123

Each request: browser sends abc123 → API fingerprints it → 9f2e7c… → looks for 9f2e7c… in sessions → found ✓
```

**Why not store the token itself?** If someone ever read the database, they'd only get fingerprints. A fingerprint can't be turned back into `abc123`, and sending `9f2e7c…` as a cookie wouldn't work (the API would fingerprint it again and find nothing). It's the same idea as the password: the database never holds the real thing.

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
