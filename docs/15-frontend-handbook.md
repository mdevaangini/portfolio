# 15 — Frontend Handbook

[← Docs home](README.md)

The single reference for the portfolio's **Angular app** (`web/`): how it starts, where every file lives and why, how pages talk to the API, how login works on the browser side, how the admin pages work, and how to explain all of it in an interview.

Written in plain words, **flow first, not line by line**. It's from the actual code in `web/src/` as of **14 Nov 2026** (end of Milestone 6). The backend side is in [14 — Backend API handbook](14-backend-api-handbook.md).

| Label | Meaning |
|---|---|
| ✅ **Live** | built, tested, on the live site |
| 🟢 **Built** | built and tested on the laptop, committed; not usable live yet (the admin user isn't on Neon yet) |
| 🕓 **Planned** | agreed, **not built** |

---

## Contents
1. [The frontend in one page](#1-the-frontend-in-one-page)
2. [How the app starts](#2-how-the-app-starts)
3. [Folders: where every file goes](#3-folders-where-every-file-goes)
4. [Pages and routing](#4-pages-and-routing)
5. [Talking to the API](#5-talking-to-the-api)
6. [Login on the browser side](#6-login-on-the-browser-side)
7. [The admin pages, one by one](#7-the-admin-pages-one-by-one)
8. [State: signals, and where RxJS still fits](#8-state-signals-and-where-rxjs-still-fits)
9. [Forms](#9-forms)
10. [Markdown and safety](#10-markdown-and-safety)
11. [Styling](#11-styling)
12. [Accessibility and performance](#12-accessibility-and-performance)
13. [Tests](#13-tests)
14. [Known gaps and what's next](#14-known-gaps-and-whats-next)
15. [Interview preparation](#15-interview-preparation)

---

## 1. The frontend in one page

**Stack:** Angular 22 (standalone components, signals, `OnPush` everywhere), TypeScript, SCSS, Reactive Forms, `marked` for Markdown, Vitest for tests. It's hosted on Vercel.

**One app, two areas:**

```
                         ┌──────────────── Angular app (web/) ────────────────┐
 visitor ──▶  /          │  PublicLayout (header + footer)                     │
                         │     └── Home: hero · impact · expertise · projects  │ ✅ Live
                         │               · experience · skills · contact       │
                         │     └── /blog, /blog/:slug                          │ 🕓 M7
                         │                                                     │
 me ──────▶  /admin/...  │  LAZY: downloaded only when /admin is opened        │
                         │  adminGuard ─▶ AdminLayout (top bar + Log out)      │ 🟢 Built
                         │     └── posts table · post editor · login page      │
                         └──────────────────────────┬──────────────────────────┘
                                                    │ every request goes to "/api/..."
                                                    ▼
                                  Express API (see handbook 14) ─▶ PostgreSQL
```

**Who does what, in one table:**

| Part | Its one job |
|---|---|
| **Components** | show data and react to clicks. They never build URLs or call `fetch` themselves |
| **Services** | the only place that talks to the API, one per group of endpoints |
| **Signals** | hold the state the screen shows; Angular redraws exactly what changed |
| **Router** | decides which frame (layout) and which page appear for an address |
| **Guards** | doormen: "may this page open?" / "may you leave this page?" |
| **Interceptor** | sits between every request and the network; renews the login when it expires |
| **Browser** | stores the login cookies and attaches them to requests. Angular never touches them |

---

## 2. How the app starts

```
index.html  (<app-root>)
   ▼
main.ts            bootstrapApplication(App, appConfig)
   ▼
app.config.ts      the app-wide "settings": router + HttpClient (+ authInterceptor)
   ▼
App (app.ts)       only <router-outlet /> + <app-dialog-host /> (the shared dialog)
   ▼
app.routes.ts      address → layout → page
```

- **There's no `AppModule`.** Everything is standalone: each component lists what it uses in its own `imports`. The app-wide setup is a plain list of *providers* in `app.config.ts`.
- **The root component does almost nothing on purpose.** Which header and footer you see is decided by the *route*, not by `App`. That's why the admin area can have a completely different frame.

---

## 3. Folders: where every file goes

```
web/src/app/
├── core/        INFRASTRUCTURE, used app-wide, no screens
│   ├── api/       api.config.ts (API_BASE_URL = "/api")
│   └── auth/      auth.service · auth.interceptor · admin.guard · auth.model
├── layouts/     PAGE FRAMES
│   ├── public-layout/   skip link + header + <main> + footer
│   └── admin-layout/    admin top bar + Log out
├── shared/      REUSABLE, no data, no feature knowledge
│   ├── ui/section-heading/   "01. Title ────"
│   ├── ui/dialog/            our own "Are you sure?" dialog
│   ├── pipes/markdown.pipe   Markdown → HTML
│   └── styles/               forms.scss, prose.scss
└── features/    ONE FOLDER PER FEATURE: component + service + model together
    ├── home/      home page + sections/* (each section has its own service + model)
    └── admin/     admin.routes · login-page · posts-page · post-editor-page
                   · admin-posts.service · post.model · api-error · unsaved-changes.guard
```

**The decision guide.** Ask these in order and stop at the first "yes":
1. Is it used by **one feature only**? → inside that feature's folder.
2. Is it a **frame around pages**? → `layouts/`.
3. Is it used by **2+ features** and knows nothing about data or a feature? → `shared/`.
4. Is it **app-wide infrastructure** (auth, API address, interceptors)? → `core/`.

**Conventions:**
- No folders by file type (no `services/`, `models/` folders) and no empty folders "for later".
- File names say what they are: `*.service.ts`, `*.model.ts`, `*.guard.ts`, `*.routes.ts`, `*.spec.ts`. Routed admin pages end in `-page`.
- **Path aliases** (`tsconfig.json`): `@core/…`, `@shared/…`, `@layouts/…`, `@features/…`. You write `import … from '@core/auth/auth.service'` instead of `../../../core/…`, so moving a file doesn't break five imports.
- Every file starts with an **ABOUT THIS FILE** comment: what it does and who uses it.

**Why this way:** a new person finds "everything about the admin" in one folder; deleting a feature means deleting one folder; and `core`/`shared` stay small because the guide pushes code *down* into features first. This is the structure the Angular style guide recommends for apps of any size.

---

## 4. Pages and routing

| Address | Frame | Page | How it loads | Status |
|---|---|---|---|---|
| `/` | PublicLayout | Home | directly (first thing every visitor sees) | ✅ |
| `/admin/login` | none | LoginPage | lazy | 🟢 |
| `/admin` | AdminLayout | → redirects to `/admin/posts` | lazy, **`canMatch: adminGuard`** | 🟢 |
| `/admin/posts` | AdminLayout | PostsPage | lazy | 🟢 |
| `/admin/posts/new` | AdminLayout | PostEditorPage (create) | lazy, **`canDeactivate: unsavedChangesGuard`** | 🟢 |
| `/admin/posts/:id` | AdminLayout | PostEditorPage (edit) | lazy, same guard | 🟢 |
| `/blog`, `/blog/:slug` | PublicLayout | blog list, article | lazy | 🕓 M7 |
| anything else | | → `/` | | ✅ |

**The three kinds of "lazy" in this app:**
1. **`loadChildren`**: the whole admin area (`admin.routes.ts`) is a separate download. Visitors never download it.
2. **`loadComponent`**: inside the admin area, each page is its own small download.
3. **`@defer (on viewport; prefetch on idle)`** on Home: the Projects section's code *and* its API call only start when you scroll near it. The code is fetched in the background when the browser is idle, so it's ready in time.

**Layout routes:** a route with a `component` (the frame) and `children` (the pages). The frame has its own `<router-outlet>`, and the page appears inside it. This is how Home gets the public header while the admin gets its own top bar.

**`posts/new` is listed before `posts/:id`.** Otherwise the router would read "new" as an id.

**Page titles:** each route has a `title`, so the browser tab says e.g. "Posts · Admin".

---

## 5. Talking to the API

### 5.1 One address: `/api`

The Angular code always calls **`/api/...`** on the *website's own address*, in development and live alike:

```
LAPTOP   browser ──localhost:4200/api/skills──▶ Angular dev server ──proxy.conf.mjs──▶ API on localhost:3000
LIVE     browser ──<site>/api/skills─────────▶ Vercel (website) ──vercel.json rewrite──▶ API project
```

- `API_BASE_URL` (in `core/api/api.config.ts`) is an **InjectionToken** whose value comes from `environments/` (`'/api'`). Every service builds its URLs from it, so the address is written once.
- **Why one address:** the browser sees the page and the data as the *same site*. That's what lets the login cookies be `sameSite: strict`, and it means CORS isn't involved at all.

### 5.2 The project convention: reads vs actions

| | **Reads** (data shown on screen) | **Actions** (on a click) |
|---|---|---|
| Tool | `httpResource` | `HttpClient` (`post`, `patch`, `delete`) |
| What you get | signals: `value()`, `isLoading()`, `error()`, `hasValue()`, plus `reload()` | an Observable: nothing is sent until you `subscribe` |
| Re-runs when | a signal it reads changes (e.g. the category filter, the post id) | never by itself, only when you call it |
| Examples | projects, experience, skills, the admin posts list, one post for the editor | contact form, login, save, publish, delete |

Both go through the same interceptor.

**The services:**

| Service | Endpoints |
|---|---|
| `features/home/sections/projects/projects.service.ts` | `GET /api/projects?category=…`, `GET /api/projects/categories` |
| `…/experience/experience.service.ts`, `…/skills/skills.service.ts` | `GET /api/experience`, `GET /api/skills` |
| `…/contact/contact.service.ts` | `POST /api/contact` |
| `core/auth/auth.service.ts` | `/api/auth/login`, `/refresh`, `/me`, `/logout` |
| `features/admin/admin-posts.service.ts` | everything under `/api/admin/posts` |

**Why `httpResource` has to be called "at creation time":** it lives as long as the component that created it and is cleaned up with it. So `loadPosts()` is called in a component *field* (`posts = this.postsService.loadPosts()`), not inside a click handler.

### 5.3 Errors

The API always answers errors as `{ error: "sentence", fields?: { name: "sentence" } }`.
- `features/admin/api-error.ts` → `apiErrorMessage(error)` turns any error into **one readable sentence**: "Can't reach the server" for status 0, the API's own sentence (plus the field messages) for 4xx, and a generic sentence for 5xx, so server details never leak onto the screen.
- The editor goes one step further: on **400/409** it puts each `fields` message **under the matching input** (`serverErrors` signal).

---

## 6. Login on the browser side

**The golden rule:** Angular **never sees the tokens**. They're in two **httpOnly** cookies that only the browser can read, so JavaScript (including any injected script) can't steal them.

| Cookie | Holds | Lives | Sent by the browser to |
|---|---|---|---|
| `access_token` | the JWT "badge" (who I am, role, expiry) | 15 min | every `/api/...` request |
| `refresh_token` | a random "locker key" | 7 days | **only** `/api/auth/...` |

**The four pieces:**

| Piece | Job |
|---|---|
| `AuthService` | `currentUser` **signal** (the whole auth state; no NgRx needed for one value); `login()`, `restore()`, `refreshTokens()`, `logout()`, `clearUser()` |
| `authInterceptor` | on a **401** from an admin call or `/me`: **one shared refresh**, then repeats the request once; if the refresh fails → forget the user and go to the login page |
| `adminGuard` (`CanMatch`) | "do we know who's logged in?" If not, ask `/me` once. Still no → `/admin/login?returnUrl=…` |
| `LoginPage` | the form; after success → back to `returnUrl` (only `/admin/...` addresses are allowed, never another website: no open redirect) |

### Flow 1: logging in
```
LoginPage ──POST /api/auth/login {email, password}──▶ API
API checks the password → response body { user } + two Set-Cookie headers
Browser stores the cookies            AuthService: currentUser.set(user)
LoginPage → navigates to returnUrl or /admin/posts
```

### Flow 2: the badge expired while I work (I click Publish)
```
1. POST /publish ─(browser adds access cookie)─▶ API: JWT expired → 401
2. interceptor catches 401 → POST /api/auth/refresh ─(browser adds refresh cookie)─▶ API
3. API: finds the key's hash, deletes it (rotation), sets NEW cookies
4. interceptor repeats POST /publish once → 200
   (if step 2 fails → clearUser() → /admin/login?returnUrl=…)
```
- The interceptor **does not check expiry beforehand**. It can't read httpOnly cookies. It's "try first, fix it if it fails".
- **One shared refresh:** if three requests get 401 at the same moment, they all wait for the *same* refresh call (`shareReplay(1)`, kept in `refreshInProgress` until it finishes). Without that, three refreshes would race, and with rotation two of them would fail.
- It **never** refreshes for `login`, `refresh` or `logout` themselves (`canRefreshFor`), to avoid endless loops.

### Flow 3: reloading the page
After a reload, the `currentUser` signal starts empty, but the cookies are still in the browser. The guard calls `restore()` → `GET /api/auth/me` (the interceptor refreshes first if needed) → the user is back and the page opens. You stay logged in for up to 7 days.

### Flow 4: logging out
`AdminLayout` → `POST /api/auth/logout` → the API deletes the refresh token and both cookies → `clearUser()` → login page (even if the call fails).

**The guard is not security.** It saves an outsider from seeing empty admin screens. The real protection is the API's `requireAdmin`: without a valid JWT, every `/api/admin` call answers 401, whatever the browser shows.

---

## 7. The admin pages, one by one

### 7.1 Posts table (`posts-page/`)
- **Reads** the list with `httpResource` and shows four states: loading / error / empty ("Write your first post") / table.
- **Row actions:** Publish ↔ Unpublish, Edit, Delete. All three go through one small helper, `run()`: lock the row → call the API → show a notice → `posts.reload()` (or show the error).
- **`busyId`** signal = the row whose request is running. Its buttons are disabled and it dims, so a double click can't send two requests (the same "first click wins" idea as RxJS `exhaustMap`).
- **Delete asks first** in the shared dialog (red Delete button), and only then calls `DELETE`. The API does a *soft* delete: the row is kept but hidden everywhere.

### 7.2 Post editor (`post-editor-page/`): one page for create and edit
```
address /admin/posts/new  → postId = null → nothing loaded → Save = POST (whole form)
address /admin/posts/7    → postId = 7    → loadPost(7) (httpResource) → form filled → Save = PATCH (changed fields only)
```
- **Filling the form:** an `effect` waits for the loaded post and calls `form.reset(post)`. `reset` also makes the form **pristine**, the new "unchanged" starting point.
- **Live preview:** `content = toSignal(form.controls.content.valueChanges)` → `<div class="prose" [innerHTML]="content() | markdown">`, shown side by side with the textarea.
- **Suggested slug:** `suggestedSlug = computed(() => toSlug(title()))`, the same rule the API uses. If you leave the slug empty, the API makes it from the title.
- **Save, new post:** POST → the API creates a **DRAFT** and returns its id → navigate to `/admin/posts/<id>` with `replaceUrl` (so Back doesn't return to an empty form) and a message passed in the navigation's `state` ("Draft created."). The form is marked pristine first, so the leave guard doesn't stop the jump.
- **Save, existing post:** `changedFields()` collects only the **dirty** controls → PATCH. Nothing changed → "Nothing to save". The API validates with `updatePostSchema` (`createPostSchema.partial()`): the same rules, every field optional.
- **Save never publishes.** Publishing is a separate decision in the table.
- **Client checks mirror the API's Zod rules** (title 3–150, slug pattern, excerpt ≤ 300, cover `https://`, content ≤ 100 000). They're for quick feedback; the API still checks everything.

### 7.3 Leaving with unsaved changes
| How you leave | What asks | Why |
|---|---|---|
| inside the app (a link, Posts, Back) | **our dialog** via `unsavedChangesGuard` (`CanDeactivate`) | the guard returns the dialog's **Promise**, and the router waits for the answer |
| closing / reloading the tab, typing a new address | the **browser's own** box (`beforeunload` on the page's `host`) | browsers forbid custom dialogs there, so sites can't trap people |

The guard works for any page that implements `HasUnsavedChanges` (`hasUnsavedChanges(): boolean`), so a future form page can reuse it.

### 7.4 The shared dialog (`shared/ui/dialog/`)
```
page or guard ─▶ dialog.confirm({ title, message, confirmText, danger })  ─▶ Promise<boolean>
                     │ the question goes into a signal (DialogService)
                     ▼
<app-dialog-host> (once, in app.html) sees it → <dialog>.showModal()
                     ▼
Leave/Delete → true      Stay/Cancel, Esc, click outside → false
```
- Built on the **HTML `<dialog>` element**. `showModal()` gives the backdrop, blocks the page behind it, keeps the focus inside, and handles Esc, all for free with no extra package.
- The **"no" button gets the focus first**, so pressing Enter by mistake never deletes anything.
- One host for the whole app → one dialog at a time (a new question answers an older one with "no").
- **Rule:** dialogs are for *decisions*. "Saved" and error messages stay small notices on the page.

---

## 8. State: signals, and where RxJS still fits

| Tool | Used for | Example |
|---|---|---|
| `signal()` | a value the screen shows | `currentUser`, `busyId`, `saving`, `notice` |
| `computed()` | a value **derived** from other signals | `isLoggedIn`, `rows`, `suggestedSlug`, `isNew` |
| `effect()` | a side effect when signals change (rarely!) | fill the editor form when the post arrives |
| `afterRenderEffect()` | DOM work after Angular has drawn | open/close the `<dialog>` |
| `httpResource` | API reads as signals | lists, one post |
| `toSignal()` | bring an Observable into the signal world **at the edge** | the editor's `valueChanges` → preview |
| RxJS | things about **time or coordination** | the interceptor: `catchError`, `switchMap`, `shareReplay`, `finalize` |

**Rule of thumb:** *signals for state shown on screen; RxJS for events over time* (debounce, cancel, combine, retry).

**Why no NgRx:** the only app-wide state is "who's logged in", which is one signal in a root service. A store would add a lot of files for nothing. NgRx (or NgRx SignalStore) becomes worth it when many features share and change the same state.

**`OnPush` everywhere:** a component redraws only when its inputs or the signals it reads change, so Angular doesn't re-check the whole page on every click.

---

## 9. Forms

- **Reactive Forms** in all three forms (contact, login, editor), using `NonNullableFormBuilder`: an emptied field goes back to `''`, not `null`, so the types stay simple.
- **Error messages appear once a field is touched**, and Save/Send calls `markAllAsTouched()` so every problem shows at once.
- **Two layers of checks:** the form's `Validators` give instant feedback; the API's Zod rules are the real ones. The API's 400/409 field messages are shown under the same inputs.
- **Dirty vs pristine** powers two features: PATCH sends only dirty fields, and the leave guard asks only if the form is dirty.
- **Signal Forms** (`form()` from `@angular/forms/signals`) are stable since Angular 22. **Decision:** stay with Reactive Forms for consistency and because most company codebases use them; migrating the login form to Signal Forms is an optional exercise after go-live (see [FAQ](12-my-questions-faq.md)).

---

## 10. Markdown and safety

```
textarea (Markdown) ──▶ markdown pipe (marked, GitHub-flavoured) ──▶ HTML string
   ──▶ [innerHTML] ──▶ Angular's SANITIZER removes <script>, onerror=…, javascript: links ──▶ screen
```
- `shared/pipes/markdown.pipe.ts` is a **pure pipe**: it runs again only when the text changes.
- **Safety is in the binding:** `[innerHTML]` always sanitizes. We never use `bypassSecurityTrustHtml`, so even pasted HTML can't run code (XSS).
- **`.prose`** (`shared/styles/prose.scss`, loaded globally from `styles.scss`) styles rendered Markdown: headings, lists, code blocks, quotes, tables. It's global because rendered HTML isn't part of any component's template, so component styles can't reach it.
- The blog pages (M7) will reuse **both**, so the preview looks exactly like the published post.

---

## 11. Styling

- **Design tokens** in `src/styles.scss` (`:root`): colours (`--color-ink` navy, `--color-accent` apricot, `--color-error`, …), fonts (Nunito, Nunito Sans, JetBrains Mono), sizes. Components use `var(--…)`, never hard-coded colours, so the look can change in one place.
- **Global styles** (`styles.scss`): only true basics: `.container`, `.btn` and its variants (`--primary`, `--navy`, `--outline`), `.visually-hidden`, reveal animations.
- **Component styles** (`*.scss` next to each component) are **encapsulated** by Angular: they can't leak into other components.
- **Shared partials** pulled in with `@use`: `forms.scss` (fields, inputs, errors) in the login, contact and editor styles. Sass rule: `@use` must come first in a file.

---

## 12. Accessibility and performance

**Accessibility**
- Skip link to the main content; one `<main>`; real `<button>`s and `<a>`s (no clickable divs).
- Notices use `role="status"`, errors use `role="alert"`, so screen readers announce them.
- Row buttons have `aria-label`s like "Delete Signals vs RxJS", not just "Delete".
- The table has a hidden `<caption>`; headers use `scope="col"`.
- The dialog: `aria-labelledby`/`aria-describedby`, the focus is kept inside, Esc closes it, and the safe button is focused first.
- Animations respect `prefers-reduced-motion`.

**Performance**
- Lazy admin area + lazy admin pages + `@defer` for Projects → a visitor downloads the smallest possible first bundle.
- `OnPush` + signals → precise, cheap redraws.
- `httpResource` cancels an old request when its signal changes (e.g. switching project categories quickly).
- The pure `markdown` pipe re-renders only when the text changes.

---

## 13. Tests

Run with **`npm test` in `web/`** (Angular's Vitest runner). Currently **7 tests**:

| File | Checks |
|---|---|
| `app.spec.ts` | the root component is created |
| `layouts/public-layout/public-layout.spec.ts` | the header's nav links are right |
| `features/home/home.spec.ts` | the hero headline appears |
| `shared/pipes/markdown.pipe.spec.ts` (2) | Markdown becomes HTML; empty text gives `''` |
| `shared/ui/dialog/dialog.service.spec.ts` (2) | the caller gets the answer; a new question answers an older one with "no" |

**Lesson learned:** components that start real API requests must not wait for "everything finished" (`whenStable`) in tests, because the requests are never answered. The tests just draw the page once (`detectChanges`).

---

## 14. Known gaps and what's next

| # | Gap / next step | Plan |
|---|---|---|
| 1 | Public blog pages (`/blog`, `/blog/:slug`) and "Latest posts" on Home | **Milestone 7**: `features/blog/`, lazy inside PublicLayout, reusing the `markdown` pipe + `.prose` |
| 2 | Admin not usable live: no admin user on Neon yet | go-live step: `create-admin` against Neon, check `JWT_SECRET` and `CORS_ORIGIN` |
| 3 | No tests for services, the interceptor or the guards | add `HttpTestingController` tests (e.g. "three 401s → one refresh") |
| 4 | Closing the tab uses the browser's box | by design; can't be changed by any website |
| 5 | Optional: login form → Signal Forms | learning exercise after go-live |
| 6 | Editor: no autosave | if wanted: RxJS `debounceTime` + `switchMap` on `valueChanges` |

---

## 15. Interview preparation

### 15.1 Decisions: what, why, alternatives, trade-offs
| Decision | Why | Alternative | Trade-off |
|---|---|---|---|
| **Feature-based folders** (`core`/`layouts`/`shared`/`features`) | everything about a feature in one place; a clear rule for each file | folders by type (`services/`, `components/`) | needs the decision guide; scales much better |
| **Standalone + `OnPush` + signals** | Angular's current way; precise redraws; less boilerplate | NgModules + default change detection | none for a new app |
| **`httpResource` for reads, `HttpClient` for actions** | reads become signals (loading/error for free, auto re-fetch); actions stay explicit | `HttpClient` + `subscribe` everywhere, or everything in RxJS | two styles to know; each fits its job |
| **One `/api` address (proxy / rewrite)** | same-site cookies, no CORS, identical code on laptop and live | API on its own domain + CORS + `withCredentials` | one rewrite rule per environment |
| **Tokens in httpOnly cookies, never in JS** | scripts can't steal them | JWT in localStorage + an interceptor adding a header | the interceptor can't read expiry, so it reacts to 401 |
| **Interceptor: one shared refresh, retry once** | no refresh races (rotation would break them); invisible to the user | refresh on a timer before expiry | needs `shareReplay` + care to avoid loops |
| **`CanMatch` guard (not `CanActivate`)** | an outsider doesn't even download the admin code | `CanActivate` (code downloads, page blocked) | none here |
| **Lazy admin + `@defer` Projects** | smallest first download for visitors | everything eager | a tiny delay when admin first opens |
| **One editor for create + edit; PATCH dirty fields** | one form, one set of rules; small, safe updates | two pages; PUT the whole post | must track dirty vs pristine |
| **Reactive Forms (not Signal Forms yet)** | mature, what most teams use; consistent across the app | Signal Forms (stable since 22) | bridge to signals with `toSignal` |
| **Own `<dialog>`-based confirm** | our look, native accessibility, no package | `window.confirm`; CDK Dialog | `beforeunload` must stay native |
| **No NgRx** | the only global state is one signal | NgRx / SignalStore | add it if many features share state |

### 15.2 Questions and answers

**Q1. Walk me through the architecture of your Angular app.**
It's standalone Angular 22 with signals and `OnPush`. The folders are by responsibility: `core` for app-wide infrastructure (auth service, interceptor, guard, API address), `layouts` for page frames, `shared` for reusable pieces with no feature knowledge, and `features` with one folder per feature. The router picks a layout per area. The admin area is lazy-loaded behind a `CanMatch` guard, so visitors never download it.

**Q2. How does authentication work in the frontend?**
The API sets two httpOnly cookies: a 15-minute JWT access token and a 7-day refresh token. Angular never reads them; the browser attaches them. An `AuthService` keeps the current user in a signal. A functional interceptor catches a 401, makes one shared refresh call, and retries the request once; if the refresh fails, it clears the user and redirects to login with a return URL.

**Q3. Why `CanMatch` and not `CanActivate`?**
`CanMatch` decides whether the route matches at all, so a lazy route's code isn't even downloaded for someone who isn't logged in. `CanActivate` would download it and then block it.

**Q4. If the guard is removed, is the admin unprotected?**
No. Guards are for user experience. Every admin endpoint is protected by the API's `requireAdmin`, which verifies the JWT's signature, expiry, issuer, audience and role. Anyone can call an API with Postman, so security must live on the server.

**Q5. What happens when three requests get a 401 at the same time?**
The first one starts the refresh and stores it as a shared Observable (`shareReplay(1)`). The other two wait for the same one. After it succeeds, all three retry. With refresh-token rotation this matters: three separate refreshes would invalidate each other.

**Q6. `httpResource` vs `HttpClient`, and when do you use which?**
`httpResource` is for reading data that's shown on screen: it gives signals for value, loading and error, and re-fetches when the signals it reads change. `HttpClient` is for actions on a click (POST/PATCH/DELETE), where I want explicit control of when the request is sent. Both go through the same interceptors.

**Q7. Signals or RxJS?**
Signals for state the template reads, with `computed` for derived values. RxJS for events over time: the interceptor's retry and shared refresh, or a debounce/autosave. At the edges I convert with `toSignal`, e.g. the editor's `valueChanges` feeds the live preview.

**Q8. How do you render user-written Markdown safely?**
A pure pipe converts Markdown to HTML with `marked`, and I bind it with `[innerHTML]`. That always runs Angular's sanitizer, which strips scripts, event handlers and `javascript:` links. I never bypass it.

**Q9. How does the editor save?**
One component handles both cases, and the route decides which: no id means a POST with the whole form (the API creates a draft and I navigate to its new address); an id means a PATCH with only the dirty controls. The API validates the PATCH with the create schema's `.partial()`. Field errors from the API are shown under the inputs.

**Q10. How do you stop someone losing unsaved work?**
A `CanDeactivate` guard asks any page implementing `hasUnsavedChanges()`. It returns our dialog's Promise, and the router waits for the answer. For closing or reloading the tab I use `beforeunload`, where only the browser's own box is allowed.

**Q11. Why your own dialog instead of `window.confirm` or a library?**
`window.confirm` can't be styled and blocks the page. I built one on the native `<dialog>` element: `showModal()` gives the focus trap, the backdrop and Esc for free. A root service holds the question in a signal and returns a Promise, and a single host component renders it. In a large app with many dialogs I'd use the CDK Dialog.

**Q12. How did you make the app fast?**
The admin is lazy-loaded behind `CanMatch`, each admin page is lazy, Projects on Home uses `@defer (on viewport; prefetch on idle)`, every component is `OnPush` with signals, and `httpResource` cancels outdated requests.

**Q13. What would you improve next?**
`HttpTestingController` tests for the interceptor (three 401s → one refresh) and the services, the public blog pages, and possibly migrating simple forms to Signal Forms.
