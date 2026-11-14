# 12 — My Questions (FAQ)

[← Docs home](README.md)

The questions I asked while building this project, with the short answers that made it click. Newest topics first inside each group. Each answer links to the page with the full details.

> Rule for this project: whenever a question comes up during development, its answer is added here.

---

## Blog (milestones 1–2)

### What did we do with `/api`? What's the point? (the "front desk")
Before, the browser visited **two addresses**: the website for the page and the API for the data. Now it only ever talks to the **website's address**. Requests starting with `/api` are forwarded to the API behind the scenes, like a front desk passing a call to the right office.
- On the laptop, the front desk is `web/proxy.conf.mjs` (4200 → 3000).
- Live, it's the `rewrites` in `web/vercel.json`.
- So Angular just calls `/api/skills`; `/api` is a label meaning "this is not a page, pass it to the API".

**Why:** the Blog login uses a cookie (a wristband). Browsers only trust a wristband given out by the building you're standing in. One address means the same building.
→ [09 — One address for website and API](09-deployment-and-configuration.md#one-address-for-website-and-api)

### How does the /api front desk work on the live server?
On the laptop, `npm start` runs the **Angular dev server**, and `proxy.conf.mjs` tells it to forward `/api`. **Live there is no Angular dev server at all.** `ng build` turns the app into plain files (HTML, JS, CSS) and Vercel serves them. So `proxy.conf.mjs` isn't used live; **Vercel itself** does the forwarding, following the `rewrites` in `web/vercel.json`.

| | Laptop (`npm start`) | Live (Vercel) |
|---|---|---|
| Who serves the website | Angular dev server, `localhost:4200` | Vercel project **devaangini**, `devaangini-portfolio.vercel.app` (built files) |
| Who forwards `/api` | the dev server, using `proxy.conf.mjs` | Vercel, using `rewrites` in `vercel.json` |
| Where it forwards to | Express on `localhost:3000` | Vercel project **portfolio** (Express as a serverless function) |
| Database | local PostgreSQL | Neon |
| What Angular calls | `/api/skills` | `/api/skills` (same code) |

```text
Visitor's browser
  └─ GET devaangini-portfolio.vercel.app/api/skills
       └─ Vercel (website project) reads vercel.json → rule 1 matches /api/…
            └─ forwards to portfolio-neon-six-56.vercel.app/api/skills
                 └─ Vercel starts the Express app (api/src/app.ts) → routes → controller → service → Prisma
                      └─ Neon (DATABASE_URL set in the API project's settings)
       ◀─ the answer comes back the same way; the browser only ever saw the website's address
```

**My own summary (checked ✓):** website and API are two separate servers, both locally and live, so something must forward `/api` requests from the website's server to the API's server. Locally that's `proxy.conf.mjs` (4200 → the API **running** on port 3000). Live it's the `rewrites` in `vercel.json`, whose `destination` is the address of the API project deployed separately on Vercel.

Things that differ live, set by settings rather than code: the database (`DATABASE_URL` → Neon), the cookie is `Secure` (https only, because Vercel sets `VERCEL=1`), the allowed Origin (`CORS_ORIGIN` = the live website address), and the contact-form firewall rule on the website project.

### Why did we add a Firewall rule on the website project too?
The guard used to stand at the API's door, counting visitors per IP. Now everyone reaches the API **through the front desk**, so the API may see only "the front desk" and count all visitors as one. So a guard also stands at the **website's door**, the one visitors really walk through.
→ [09](09-deployment-and-configuration.md#one-address-for-website-and-api)

### What exactly is Express doing?
**Express is a library (npm package) that makes it easy to build a web server in Node.** Node alone can receive requests, but only raw ones: one function gets every request and must work out everything itself. Express gives that raw request a structure.

| Without Express (plain Node `http`) | With Express |
|---|---|
| One function receives **every** request; write `if (url === "/api/skills" && method === "GET")` for each one | **Routing:** `router.get("/skills", getSkills)` |
| Read the body yourself, piece by piece, and parse the JSON | `express.json()` → `req.body` |
| Read the raw `Cookie` text yourself | `cookieParser()` → `req.cookies` |
| Write the status, headers and JSON text by hand | `res.status(404).json({...})`, `res.cookie(...)` |
| Build your own "run these checks first" system | **Middleware:** `app.use(...)`: steps every request passes in order (CORS, guard, 404, errors) |
| Read `/api/projects/3` and pull out `3` yourself | `req.params.id`, `req.query.limit` |

**Comparison (better version, my own correction ✓):** Express is closer to **React** than to Angular. It's *minimal and unopinionated*: it gives the basics (routing, middleware, `req`/`res` helpers) and leaves the structure to me. That's why the controller / service / `modules/` layout is **our convention**, not something Express requires. (Express calls itself a "minimal framework"; in practice it behaves like a library.)

| Frontend | Backend (Node) | Style |
|---|---|---|
| React | **Express** | minimal: you choose the structure |
| Angular | **NestJS** | full framework: modules, controllers, services, dependency injection, decorators (NestJS is inspired by Angular) |

Why this project uses Express and not NestJS: Express shows the request flow plainly (nothing hidden behind decorators), which is better for learning how a backend works. NestJS is common in companies for big teams because it enforces one structure. Good interview answer: "I used Express to understand the fundamentals; I organised it NestJS-style myself: routes, controllers, services, middleware."

In our project, Express is: `express()` in `app.ts` (the app), `Router()` in every `*.routes.ts`, `req`/`res` in every controller, and middleware like `requireAdmin`. Services and Prisma don't use Express at all.

### Controller and service: my summary (checked ✓, 6 Nov 2026)
**Service** = the data work: the Prisma queries (read/write the database) and the data rules (e.g. "only publish a finished post", "soft delete frees the slug"). **Controller** = the request/response work: reads the request, checks the input (Zod), calls the service, and turns what the service returns into a status code + JSON.

The full path of a request: Angular → `app.ts` pipeline (CORS, JSON body, cookies) → `routes.ts` → for admin routes `checkOrigin` + `requireAdmin` → **controller** (checks input; bad → 400 here, the service never runs) → **service** → Prisma → Postgres → back: service returns data or a result like "not-found" → **controller** picks the status (200 / 201 / 404 / 409 …) → Angular.

### Admin login on the website (milestone 6a): my three questions (10 Nov 2026)
**1. Who makes the tokens, and who sends them?** The **login API** (backend) creates both tokens and sends them in `Set-Cookie` response headers; the **browser** stores them and attaches them by itself: `access_token` to every `/api/...` call, `refresh_token` only to `/api/auth/...`. The login *page* only sends email + password; Angular never touches the tokens.

**2. New users / non-admins / a posts page for visitors?** Logging in never creates a user: there's no sign-up; the only user (me) is made with `npm run create-admin`. Visitors don't log in at all; `/admin/...` sends them to the login page, and the API refuses `/api/admin` anyway. Visitors read posts on a **different** page: the public blog `/blog` (milestone 7, `features/blog/`, using `/api/posts`), not the admin's `/admin/posts` (milestone 6b, all my posts + edit buttons, using `/api/admin/posts`).

**3. Why am I still logged in after a reload, even after deleting `access_token`?** A reload wipes Angular's memory (the `currentUser` signal) but **cookies survive**. The guard asks `GET /api/auth/me`: with a valid `access_token` → 200 → logged in. Without it → 401 → the **interceptor** calls `POST /api/auth/refresh` (the browser sends `refresh_token`) → new cookies → it repeats `/me` → 200. Network tab: `me` 401 → `refresh` 200 → `me` 200. Delete **both** cookies → refresh fails too → login page.

### The posts table (6b): `run()`, `busyId` and `exhaustMap`
- **`run()`** writes the five steps every row action shares **once** (lock the row → clear the message → call the API → success: unlock + message + `posts.reload()` / error: unlock + message). Each action passes only what differs: the prepared request (an Observable, sent only when `run()` subscribes) and the success text. DRY: one place to change.
- **The id travels in the URL:** `POST /api/admin/posts/5/publish`. The API finds row 5, checks the rules, and updates **the same row** (`status = PUBLISHED`, `published_at` the first time). The public API shows it because it only returns PUBLISHED, not-deleted rows.
- **`busyId`** = the row whose request is **in progress** (set when an action starts, cleared when the API answers): its buttons are disabled and it dims, so a double click can't send two requests. (Delete now asks in the shared dialog, see "Why our own dialog" below; the old `confirmDeleteId` in-row question is gone.)
- **Like RxJS `exhaustMap`:** both make "the first click wins, extra clicks are ignored until it finishes". `busyId` also **shows** it (disabled button) and works per row; `exhaustMap` silently drops clicks in a stream. Real projects often use both.

### Editor (6c): why signals (`toSignal`) for the title and content, not RxJS?
The form's `valueChanges` **is** RxJS; `toSignal()` converts it **at the edge** into a signal, and everything after that is signals:
- the template reads `content()` / `title()` directly: no `async` pipe, no `subscribe`, no unsubscribe (toSignal cleans up itself);
- **derived values are one line**: `suggestedSlug = computed(() => toSlug(this.title()))`;
- works naturally with `OnPush` (signals tell Angular exactly what changed);
- it's Angular's direction (signals, `httpResource`, Signal Forms, stable since Angular 22).

**When RxJS would be the better tool:** anything about **time or async coordination**: `debounceTime(300)` before an expensive preview or an autosave, `switchMap` to cancel an old save when a new one starts, `combineLatest` of several async sources, `exhaustMap` for "first click wins". Rule of thumb: **signals for state shown on screen; RxJS for events over time.**

**One line for an interview:** *"The form's valueChanges is an Observable; I convert it with toSignal because the preview is just state the template reads, and computed() derives the suggested slug. If I needed debouncing or autosave with cancellation, I'd keep it in RxJS with debounceTime/switchMap and convert only the final value."*

### M7 check Q1: on `/blog?tag=angular` I click "Signals". How does the list change? (my answer, corrected ✓)
- ✅ `tag=signals` goes into the URL's query params; the router's input binding hands it to the page; the new list replaces the old one without a reload (SPA).
- 🔧 **Angular does not filter the list itself.** The browser only holds one page (10 posts), so local filtering would miss posts on other pages. **The API filters, in the database.**
- **The chain:** chip = link → the URL changes first → input binding gives `tag = "signals"` → `selectedTag` (computed) changes → `httpResource` sends `GET /api/posts?tag=signals&limit=10&offset=0` → the DB returns the newest 10 Signals posts → new cards replace the old (which dimmed meanwhile).

**Interview line:** *"The chip only changes the URL. The tag arrives as a signal input, and `httpResource` refetches with the new tag. Filtering and paging happen on the server, so the client never needs every post."*

### M7 check Q2: someone opens `/blog/my-draft-post` (a draft). What happens? (my answer + the missing parts ✓)
- ✅ **404 Not Found:** visitors only ever see published posts. Even better: the 404 is **identical** to an unknown slug, so nobody can tell a draft exists (no 403, which would reveal "something is here").
- **The page shows:** "This post doesn't exist (any more)." + "See all posts", not an error box.
- **Why no "Try again":** retrying can't help (a draft stays a draft). The page checks `notFound()` (status 404) **before** the general `error()` branch; only other errors (server down, network) get Try again.

**Interview line:** *"Drafts return 404 like unknown slugs, so their existence isn't revealed. The page branches on the status: 404 → not-found page; other errors → retry."*

### M7 check Q3: I publish a 4th post. What changes in "Latest writing"? How to show 6? (my answer, checked ✓)
- The newest is first: before = 3, 2, 1 → after = **4**, 3, 2. Only the **oldest** (1) drops off. Home shows it on the next load (it asks the API once per visit; no live update).
- **6 posts:** change `pageSize: 3` → `pageSize: 6` in `latest-posts.ts`. The grid (`auto-fit`) makes it 2 rows of 3 by itself.

### "Latest writing" on Home: how many posts? Is there pagination?
**At most 3, the newest; no pagination, no tag chips.** It's a teaser: `loadPosts(() => ({ tag: null, page: 1, pageSize: 3 }))` → `GET /api/posts?limit=3&offset=0` (the API sorts newest first). 1 post → 1 card, 0 → the section is hidden. A new post appears first and the oldest of the three drops off. Filters and pages live only on `/blog` ("All posts →"). To show more, change `pageSize`. It appears only when you scroll near the bottom (`@defer on viewport`).

### `withInMemoryScrolling()`: what problem does it solve? (the easy version)
**Picture:** a normal website gives you a **new sheet of paper** for every page, so you start at the top. Angular uses **one whiteboard**: it wipes and redraws the content, but your scroll position (how far down you are) **stays where it was**. That causes three problems:
1. **A new page opens in the middle** (you clicked the 8th post far down the list) → `scrollPositionRestoration: 'enabled'` = "new page → go to the top".
2. **Back doesn't return to my spot** → the **same switch** remembers how far down each page was ("in memory") and scrolls back there, like a bookmark.
3. **"02. work" from the blog stays at the top of Home** → `anchorScrolling: 'enabled'` = "`#work` in the address → scroll to the element with `id="work"`" (its name tag).
- **Sticky header:** Angular would put the section at the very top edge, under the header, so the header tells Angular its height (`ViewportScroller.setOffset`) = "stop that many pixels earlier".
- **Watch out:** a filter chip changes the address, so it counts as a new page and jumps to the top (fine on the blog list).

**How Angular decides where to put you (in this order):** 1. Back/Forward → the **remembered** position · 2. the address has `#name` → the element with `id="name"` (minus the header height) · 3. otherwise → the **top**.

| You do | Address | Rule | You see |
|---|---|---|---|
| scroll the list to the 8th post | `/blog` | (you scroll) | position 2100 |
| click the 8th post | `/blog/8th-post` | 3 → top | the article's title (without the switch: the middle of the article) |
| click "02. work" in the header | `/#work` | 2 → `#work` | the Projects title, just below the sticky header |
| Back | `/blog/8th-post` | 1 → remembered | the article where I left it |
| Back again | `/blog` | 1 → remembered | the list at the 8th post |

Where in the code: the switches in `app.config.ts`; the link `routerLink="/" fragment="work"` in `header.html`; the name tag `id="work"` on Projects (and its `@defer` placeholder); `ViewportScroller.setOffset` in `header.ts`.

### Blog list (7a): how does the tag filter / page work? (the easy version)
**The address is an order slip.** `/blog?tag=angular&page=2` = "Angular posts, page 2" (the part after `?` = query params). Same idea as `/admin/posts/7`, where the 7 tells the editor which post.
- **Address bar** = the slip, **list page** = the waiter, **API** = the kitchen, **screen** = the plate. The waiter always follows the slip.
- **Opening `/blog`:** the router picks the blog page (inside the normal header + footer) and hands it the slip ("no tag, no page" = all posts, page 1) → the page asks `GET /api/posts?limit=10&offset=0` → the cards + "Page 1 of 3".
- **Clicking a chip:** it's only a link; it **only changes the address** (`?tag=angular`). The page sees the new slip and asks the API again **by itself**. Nobody wrote "on click, call the API".
- **Free bonuses:** Reload keeps the filter, Back returns to the previous one, a shared link shows the same list, all because the slip is in the address.
- **Page → API:** page 2 = skip 10 (offset), take 10 (limit).
- **Names:** slip = query params; "hand the slip to the page" = `withComponentInputBinding()`; the page receiving it = `tag = input()`, `page = input()`; "ask again when it changes" = `httpResource`.
- **Header:** the section links now mean "go to Home, then jump to the section", so they work from the blog too; the scroll stops below the sticky header.

### What is `admin-posts.schema.ts`? Is it the set of rules we check?
**Yes: the rulebook for a post's fields**, written with Zod (the server's `Validators`). No database, no request handling. The controller runs it first: `checkBody(createPostSchema, req.body)` → invalid = **400** + one message per field (the service never runs); valid = clean data → service.
- **Three jobs at once:** check (field messages), clean (trim, lowercase slug/tags, `""` → `null` cover), type (`z.infer` makes the TypeScript type *from* the rules).
- **Only `title` is required** on create; slug, excerpt, content, cover and tags are optional (a draft can be unfinished). Unknown fields like `status` are dropped, so nobody can create an already-published post.
- **`createPostSchema`** → POST; **`updatePostSchema = createPostSchema.partial()`** → PATCH (everything optional).
- **Not in this file:** "excerpt + content are needed before publishing". That's a business rule about the post's state, so it lives in the service's `publish`.
- The editor's Angular `Validators` mirror these rules for quick feedback; **this file is the one that counts**, because anyone can call the API directly.

### The admin controller also has rules. Is that different from `schema.ts`?
**Yes: each layer checks what only it can know.**

| Where | Checks | Examples |
|---|---|---|
| **schema.ts** (Zod) | the **body's fields**, each on its own | title 3–150, slug pattern, excerpt ≤ 300, https cover, ≤ 8 tags |
| **controller** | the **request** around the body | id in the URL is a positive whole number; the slug made from the title is ≥ 3 characters (`"!!!"` passes the title rule but gives an empty slug); an empty PATCH `{}` → "Nothing to change" |
| **service** | **business rules** that need the saved post | publish only with excerpt + content; a published post can't be emptied |
| **database** | rules that must hold even under races | unique slug |

The controller also **translates** service results into status codes (`slug-taken` → 409, `not-found` → 404, `incomplete` → 400); those decisions are made by the service or database.

**Rule of thumb:** schema = "is each field OK?"; controller = "is the request OK?" + which status; service = "allowed for this post now?"; database = "true for all posts?".
**Could move to Zod:** the id (`z.coerce.number().int().positive()`, as the public posts controller does for its query) and the empty PATCH (`.refine`). Keeping them in the controller is simple and readable; both are fine.

### M6 check Q1: the access token expired and I click Publish. What happens? (my answer, corrected ✓)
**Correction:** the interceptor does **not** check whether the token has expired. It **can't**: the cookies are httpOnly, so JavaScript can't read them. It reacts **after** the API says 401 ("try first, fix it if it fails"):
1. Publish → the browser adds the access cookie → API `requireAdmin`: JWT expired → **401**.
2. The interceptor catches the 401 → `POST /api/auth/refresh` (the browser adds the **refresh** cookie, which only goes to `/api/auth/…`).
3. The API finds the hash in `refresh_tokens`, deletes it (rotation), sets **new** access + refresh cookies.
4. The interceptor **repeats Publish once**, this time with the new access cookie → 200 → the table reloads.
5. If the refresh fails too (e.g. after 7 days) → the login page.

**Interview line:** *"The interceptor can't read httpOnly cookies, so it doesn't check expiry up front. It reacts to a 401: one shared refresh call, the browser stores the rotated cookies, and the original request is retried once."*

### M6 check Q2: if someone deletes `adminGuard`, can a stranger publish? (my answer, checked ✓)
**No.** The guard only stops people at the door of the user interface; the real security is **`requireAdmin` in the API**, which also applies to Postman calls. It checks the **JWT inside the cookie**: the signature (`JWT_SECRET`, the "real stamp"), expiry (15 min), issuer/audience, and role `ADMIN`. If any check fails, the controller never runs.
- Precise detail: the guard doesn't hide buttons. It decides whether the `/admin` routes **match and load**. Without it a stranger could open the admin screens, but every API call → 401 → refresh fails → login page.
- Remaining risks: a stolen cookie or a leaked secret. That's why the cookies are httpOnly + sameSite strict, `checkOrigin` exists, the access token lasts only 15 min, and the secret is only in `.env` / Vercel.

**Interview line:** *"Frontend guards are for user experience, not security: anyone can call the API directly. Every admin endpoint is protected server-side by `requireAdmin`, which verifies the JWT's signature, expiry, issuer, audience and role before the controller runs."*

### M6 check Q3: I change only the excerpt of post 7 and click Save. What happens? (my answer + the missing part ✓)
- **Request:** `PATCH /api/admin/posts/7` (the 7 comes from the address). **Body:** only the dirty field, `{ "excerpt": "…" }`.
- **Rules (the part I missed):** the route decides the schema. `PATCH /:id` → `checkBody(updatePostSchema, body)`, and `updatePostSchema = createPostSchema.partial()`: the **same rules** as create, but every field is optional. A missing field is fine; a sent field must pass its rule (otherwise 400 with `fields`). One source of truth for both.
- The service updates only the `excerpt` column (+ `updatedAt`); everything else stays as it was → 200 + the updated post.

**Interview line:** *"Update is a PATCH with only the dirty fields. The API validates it with the create schema's `.partial()`: one set of rules, missing fields allowed, present fields must be valid. The service updates only those columns."*

### Editor (6c): Save on a new post = create API, Save on an existing post = update (PATCH)?
**Yes.** The address decides:

| Address | Save calls | API |
|---|---|---|
| `/admin/posts/new` (no id) | `create()`, whole form | **POST** `/api/admin/posts`, checked by `createPostSchema`, saved as **DRAFT**, returns the new id → Angular goes to `/admin/posts/<id>` with "Draft created." |
| `/admin/posts/5` | `update(5, …)`, only the **dirty** (changed) fields | **PATCH** `/api/admin/posts/5`, checked by `updatePostSchema` (`.partial()`), changes only those columns |

PUT = replace everything; PATCH = change just these parts. **Save never publishes**: Publish is its own call (`POST /api/admin/posts/5/publish`).

**Interview line:** *"One editor serves create and edit; the route tells it which. No id → POST the full form; an id → PATCH only the dirty fields. The API validates create with the full schema and update with its `.partial()`."*

### Why our own dialog instead of `window.confirm`? (6d, my decision: option A)
The browser's box can't be styled, looks different in every browser and freezes the page. I chose **A: the HTML `<dialog>` element + our own `DialogService`** (no package; the browser gives the backdrop, focus trap and Esc for free). B = Angular CDK Dialog (good for big apps with many dialogs), C = a hand-made div (we'd have to build all the accessibility).

**Flow:** a page or guard calls `dialog.confirm({...})` → the service puts the question in a **signal** and returns a **Promise** → `<app-dialog-host>` (once in `app.html`) sees the signal and calls `showModal()` → the user clicks Leave/Stay (Esc or click outside = Stay) → `answer(true/false)` resolves the Promise → the caller continues. The guard just returns that Promise: **guards may return a Promise, and the router waits**.

**Where:** "Leave without saving?" (guard) and "Delete this post?" (posts page). Rule: **dialogs are for decisions**; "Saved" / errors stay small notices.

**One limit:** closing or reloading the tab (`beforeunload`) can **only** show the browser's own box. Browsers forbid custom dialogs there so sites can't trap people.

**Interview line:** *"I built one shared confirm dialog on the native `<dialog>` element: a root service holds the question in a signal and returns a Promise, a single host component renders it. Guards return that Promise. In a larger app I'd use CDK Dialog."*

### Reactive Forms or Signal Forms for this project?
**Decision: keep Reactive Forms** (contact, login, editor). Signal Forms (`form()` from `@angular/forms/signals`) are a public API since Angular 22.0 (checked in my installed 22.2), so they are a real option, but:
- **jobs and interviews:** most company codebases use Reactive Forms;
- **consistency:** one form system in one small app is easier to read; mixing two is a typical review comment;
- the editor already gets the signal benefits through `toSignal()` + `computed()`.

| | Reactive Forms | Signal Forms |
|---|---|---|
| Building blocks | `FormGroup` / `FormControl`, `Validators`, `valueChanges` (Observable) | a `signal` holds the data; `form(model, rules)` builds the fields |
| Reading values | `.value`, or `toSignal(valueChanges)` | already signals |
| Maturity | years, everywhere | new (Angular 22) |

**Optional exercise after go-live:** migrate the **login form** (2 fields, simple rules) to Signal Forms to compare them.

**Interview line:** *"Reactive Forms are the mature standard most teams use; Signal Forms, stable since Angular 22, make form state signals natively. In an existing app I'd stay consistent and migrate gradually, starting with simple forms like login."*

### httpResource vs HttpClient: where are my API services?
Every endpoint group has its own service, next to the component that uses it (`projects.service.ts`, `skills.service.ts`, `contact.service.ts`, `core/auth/auth.service.ts`). **Reads** use `httpResource` (Angular 19.2+): signals for `value()`, `isLoading()`, `error()`, no subscribe, reloads when its signals change. **Actions** (POST/PATCH/DELETE) use classic `HttpClient` observables. Both go through the same interceptors.

### Is middleware like an Angular interceptor?
**Yes, the same idea:** a chain of steps a request passes through, where each step can **look at or change** it, **pass it on**, or **stop it**. Even the code shape matches: an interceptor calls `next.handle(req)`; Express middleware calls `next()`.

Two differences:
1. **Where it runs:** an Angular interceptor runs in the **browser**, on requests going **out**. Express middleware runs on the **server**, on requests coming **in**.
2. **Not every middleware runs for every request:** it depends on where it's registered.

| Middleware | Registered | Runs for |
|---|---|---|
| `cors()`, `express.json()`, `cookieParser()` | `app.use(...)` in `app.ts` | **every** request, before routing |
| `checkOrigin` | in front of `/auth` and `/admin` (`routes.ts`) | only those paths |
| `requireAdmin` | inside `admin.routes.ts` | only `/api/admin/...` (like a `CanActivate` guard) |
| `notFound`, `errorHandler` | at the **end** of `app.ts` | only as a fallback: nothing answered (404) or a crash (500) |

### What's the difference between `server.ts` and `app.ts`?
**`server.ts` runs ONCE, when the API starts. `app.ts` describes what happens to EVERY request.** A request from Angular never "goes through" `server.ts`; it only goes through what `app.ts` set up.

| | `server.ts` | `app.ts` |
|---|---|---|
| Runs | once, at start-up (`npm run dev`) | its pipeline runs for every request |
| Job | opens the door: "listen on port 3000" | the route every request walks: CORS → JSON body → cookies → `/api` routes → 404 → 500 |
| Angular equivalent | `main.ts` (`bootstrapApplication`, runs once) | `app.config.ts` + `app.routes.ts` (how the app handles everything) |
| Restaurant picture | unlocking the door at 9 a.m. | what happens to each customer: greeted, seated, order taken, served |
| Used live on Vercel? | **no**: Vercel opens its own door | **yes**: Vercel takes the app from `app.ts` (its `export default`) |
| Used by tests? | no | yes: Supertest sends fake requests straight into `app` |

```text
npm run dev → server.ts → imports app (built in app.ts) → app.listen(3000)   ← once
Request     → port 3000 → app.ts pipeline → routes.ts → controller → …         ← every time
```

**My own summary (checked ✓):** `npm run dev` runs `server.ts` once; from then on the server is **running** and keeps listening on port 3000 for requests from Angular, until I stop it (Ctrl + C or closing the terminal). Its code finished after `app.listen(3000)`, but the open port keeps the program alive. Saving a file makes `tsx watch` restart it. (Word to avoid mixing up: this is the **running local** server; "live" means the deployed site on Vercel.)

**What `app.ts` does, line by line in plain words (my summary, checked ✓):**
1. `express()` creates the app (an empty pipeline).
2. `cors(...)`: adds a header to answers saying which website may **read** them (`CORS_ORIGIN`). It doesn't block requests; the **browser** enforces it. Since the `/api` front desk, page and API share one address, so CORS rarely matters now.
3. `express.json(...)`: reads the request **body** (the payload Angular sends, e.g. the contact form) → `req.body`.
4. `cookieParser()`: reads the **`Cookie`** request header → `req.cookies` (other headers are already in `req.headers`).
5. `app.use("/api", apiRouter)`: hands the request to `routes.ts` → the feature's routes → controller.
6. `notFound` and `errorHandler` are only reached if nothing answered (404) or something crashed (500).
7. Exports the `app` instance twice: `export const app` (for `server.ts` and tests) and `export default app` (for Vercel). It never starts listening itself.

**Do GET requests skip `express.json()`?** No line is skipped: **every** request walks the whole pipeline. But a GET has **no body** (its data travels in the URL: `/api/projects?limit=10` → `req.query.limit`, `/api/projects/3` → `req.params.id`). So `express.json()` looks, finds no JSON body, does nothing and passes it on. Bodies come with POST, PATCH and PUT. `cookieParser()` also runs every time; with no cookie, `req.cookies` is just `{}`.

**Why split them:** so the same `app` can be used in three places (laptop, Vercel, tests). Only the laptop needs `server.ts` to open a port.

### What is Vitest? Is it part of VS Code, Angular or Node?
None of them. It's an **npm package that runs tests in the terminal** (`npm test`). The web project already used it: Angular calls Vitest behind the scenes, which is how the "3 passed" appeared. The API has no Angular in between, so it calls Vitest directly. **Supertest** is a helper that acts like Postman inside a test: it sends a request into the Express app and checks the answer.
→ [08 — Testing](08-testing-and-debugging.md)

> 📌 **The whole JWT login on one page, for interviews:** [13 — JWT login: my interview notes](13-jwt-login-notes.md)

### Sessions or JWT? My decision (Session B, 3 Nov 2026)
Both are real industry practice. **Sessions:** a random ticket, looked up in a table on every request; logout is instant. **JWT:** a signed token that *contains* who I am (`userId`, `role`, expiry); the server checks the signature, with no database lookup; harder to cancel before it expires.

**I chose JWT** because I want the practice companies follow in real-world SPAs, and I've never implemented it myself.

Inside JWT I picked:
- **1a, an httpOnly cookie** (not localStorage), so page scripts can't steal it;
- **2b, access + refresh tokens:** a short access JWT (15 min) for every request, plus a long refresh token (7 days, stored in the database) only used to get a new access JWT. A stolen access token dies within 15 minutes; logout deletes the refresh token;
- **3a, a well-known library (`jose`):** signing is security code you don't write yourself.

**The JWT flow as an office building (the picture that made it click):**
1. **Login = reception.** Show ID + password once. You get a **visitor badge** (name, "ADMIN", "valid until 3:15", with the company's secret stamp; valid for **15 min**) and a **locker key** (written in reception's **book**, valid for **7 days**).
2. **Every admin action = a door.** The **guard** checks the badge: real stamp? not expired? ADMIN? → go in. No phone call to reception.
3. **Badge expired** → go back to reception with the locker key → reception checks its book → takes the old key, gives a **new key + new badge**. (Angular will do this trip automatically.)
4. **Logout** → reception crosses the key out of its book; the badge is thrown away.

Why two things: the badge is **fast** (everything is printed on it) but can't be cancelled, so it's short-lived. The key **can be cancelled** (it's in the book), so it can live longer.

| Picture | Project |
|---|---|
| visitor badge | access token (JWT), in a cookie |
| secret stamp | signature made with `JWT_SECRET` |
| guard | `requireAdmin` |
| locker key | refresh token, in a second cookie |
| reception's book | `refresh_tokens` table |
| going back to reception | `POST /api/auth/refresh` |

**My answer to "why can the guard decide alone, but reception needs its book?" (checked ✓):** the guard can decide because everything it needs is written on the badge itself. Reception needs its book to check whether that locker key is still on its list; only then does it give a new badge (with a new stamp) and a new key.

**My B2 flow, checked ✓ (4 Nov 2026):**
1. Login (`POST /api/auth/login`) with email + password → the response sets **two cookies** in its **headers** (`Set-Cookie: access_token=…` and `Set-Cookie: refresh_token=…`). The JSON body only says `{ user }`; the tokens are never in the body.
2. **Which cookie goes where** (decided by each cookie's `path`):

   | Cookie | path | The browser attaches it to |
   |---|---|---|
   | `access_token` (badge) | `/api` | **every** `/api/...` call: admin doors, `/api/auth/me`, and also public ones like `/api/skills` (harmless: they ignore it) |
   | `refresh_token` (locker key) | `/api/auth` | **only** `/api/auth/...`: refresh, logout (and login, me, which ignore it) |

   The powerful 7-day key travels as little as possible; the badge goes everywhere, but it dies in 15 min.
3. **Who calls `/api/auth/refresh`?** Right now nobody automatically: I call it by hand in Postman. In **Milestone 6** an **Angular interceptor** will do it: when an admin request gets **401** → call `/refresh` once → retry the request; if refresh also fails → go to the login page.

*(The login flow summary below describes the **first version, with sessions** (until 4 Nov 2026). It's kept because the comparison is useful in interviews. Today: see "My B2 flow" above.)*

### My own summary of the login flow (checked ✓)
1. I enter email + password on the login page; Angular sends them to the **login API** (`POST /api/auth/login`).
2. The **backend** fingerprints the password and compares it with `users.password_hash`. No match → 401, nothing else happens.
3. Match → the backend makes a random **token**, stores its **fingerprint** in `sessions.token_hash`, and sends the token back **in the `Set-Cookie` response header** (not in the JSON).
4. The **browser** stores the token as a **cookie** and attaches it to every later `/api` request by itself.
5. On each admin request, the backend **fingerprints the cookie** and looks for that fingerprint in `sessions` (and checks it hasn't expired). Found → it's an admin request and it's allowed. Not found → 401.

The password is checked once (step 2); after that, only the cookie is checked (step 5).

**If the cookie doesn't match (step 5 fails):** the API just answers **401 "Not logged in."** Nothing is deleted from `sessions`: there's no matching row to delete. `/me` also tells the browser to throw away the useless cookie. Rows are deleted only by **logout** (my own row) and by the clean-up of **expired** sessions at the next login.

### Milestone 3 in three lines (my summary, checked ✓)
- **3a, login:** check the password; if right, create a session and **give** the cookie (`Set-Cookie` in the **response** header). We only write the response header; the browser attaches the request headers by itself.
- **3b, read it:** **read** the cookie from the **request** (cookie-parser) and use it for `/me` (who am I?) and `/logout` (delete the session).
- **3c, guard it:** before any `/api/admin/...` action, read the cookie, check **logged in** (fingerprint in `sessions`, not expired), then check **admin** (`role = ADMIN`). Either no → 401 and the action never runs.

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

### How does Prisma get into the picture, and when does `db/prisma.ts` run?

**Prisma is the translator between TypeScript and the database.** A service writes `prisma.skillGroup.findMany(...)`; Prisma turns it into SQL, runs it on Postgres, and hands back the rows as normal TypeScript objects. Nobody writes SQL by hand.

**What "client" means:** the object your code uses to talk to the database, named `prisma` in our code. It has one property per table (`prisma.skillGroup`, `prisma.post` …) and methods on each (`findMany`, `create`, `update`, `delete`). Angular has the same idea: `HttpClient` is the object you use to talk to an API; the **Prisma Client** is the object you use to talk to a database.

**Part 1 · The two commands (setup, run by me in the terminal).** Only when I change `schema.prisma`, never while the API is serving requests.

| Command | What it does | Changes |
|---|---|---|
| `npx prisma migrate dev --name x` | Reads the schema, writes a SQL file into `migrations/`, runs it on my local database → the **tables** exist | the database |
| `npx prisma generate` | Reads the schema and writes the **client's code** into `generated/prisma/`, so TypeScript knows `prisma.skillGroup`, its columns, and autocompletes them | the code (TypeScript) |

Order: migrate first (build the tables), then generate (teach TypeScript about them). Live, Vercel runs both automatically on every deploy.

**Part 2 · Start-up: `db/prisma.ts` runs once.** When the API starts, `server.ts` imports `app.ts` → routes → controllers → services. The first service that imports `prisma` makes Node run `db/prisma.ts`, which creates **one instance** of the client with the database address (`DATABASE_URL`). Node remembers it, so **every service shares that same instance**. No new one is created per file or per request. It connects on the first query and then reuses the connection. *(Angular: a service with `providedIn: 'root'`.)*

**Part 3 · Every request: what happens when a service runs.** Real code from the Skills feature:
```ts
// skills.controller.ts
const groups = await findSkillGroups();
res.status(200).json(groups);

// skills.service.ts
export function findSkillGroups() {
  return prisma.skillGroup.findMany({ orderBy: …, select: { …, skills: … } });
}
```
1. **Controller** calls the service function `findSkillGroups()`.
2. **Service** calls a method on the shared `prisma` instance: `prisma.skillGroup.findMany(...)`.
3. **Prisma** writes the SQL: `SELECT … FROM skill_groups … ORDER BY display_order` (+ one for the skills).
4. **Postgres** runs it and sends back rows.
5. **Prisma** turns the rows into objects: `display_order` → `displayOrder`, each group with its `skills` inside.
6. **Service → controller:** the service `return`s that result; the controller `await`s it and sends it with `res.json`.

**What does `return` give back?** Not Prisma itself: the **result** of Prisma's call. Because the database takes a moment, that result is a Promise of the data, so the controller writes `await`. Same as an Angular service doing `return this.http.get(...)`: the component receives the data, not the `HttpClient`.

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
