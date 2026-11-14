# 16 — Angular Approaches Playbook

[← Docs home](README.md)

**Every Angular approach I used while building this portfolio, and *why* we chose it**, written so I can reuse it in another project. Each entry answers the same questions:

- **Problem:** what goes wrong without it?
- **Old way:** how it's usually done in older code (what I'll still see at work)
- **What we do:** the approach, with a small piece of code to copy
- **Why:** the reason we chose it in this project (from our discussions)
- **Watch out:** traps and limits
- **Interview line:** one sentence to say it well

How the whole app fits together is in [15 — Frontend handbook](15-frontend-handbook.md). This page is the toolbox. **Rule from now on:** every new approach gets an entry here when we use it.

---

## Contents
**1. Set-up and structure**
1. [Standalone components + `app.config.ts`](#1-standalone-components--appconfigts)
2. [`inject()` instead of constructor parameters](#2-inject-instead-of-constructor-parameters)
3. [Feature-based folders + a decision guide](#3-feature-based-folders--a-decision-guide)
4. [Path aliases (`@core/…`)](#4-path-aliases-core)
5. [One `/api` address + an `InjectionToken`](#5-one-api-address--an-injectiontoken)

**2. Components and templates**

6. [`OnPush` everywhere](#6-onpush-everywhere)
7. [Built-in control flow (`@if`, `@for`)](#7-built-in-control-flow-if-for)
8. [Signal inputs (`input()`) and signal queries (`viewChild()`)](#8-signal-inputs-input-and-signal-queries-viewchild)
9. [`host: {…}` instead of `@HostListener`](#9-host--instead-of-hostlistener)

**3. Routing**

10. [Layout routes (a frame with pages inside)](#10-layout-routes-a-frame-with-pages-inside)
11. [Lazy loading (`loadChildren`, `loadComponent`)](#11-lazy-loading-loadchildren-loadcomponent)
12. [`@defer`: load a section when it's near the screen](#12-defer-load-a-section-when-its-near-the-screen)
13. [`withComponentInputBinding()`: URL values become inputs](#13-withcomponentinputbinding-url-values-become-inputs)
14. [The URL as the source of truth for lists](#14-the-url-as-the-source-of-truth-for-lists)
15. [`withInMemoryScrolling()`: scroll like a normal website](#15-withinmemoryscrolling-scroll-like-a-normal-website)
16. [Passing a one-time message during navigation (`state`)](#16-passing-a-one-time-message-during-navigation-state)

**4. Data and the API**

17. [`httpResource` for reads, `HttpClient` for actions](#17-httpresource-for-reads-httpclient-for-actions)
18. [One error helper for API messages](#18-one-error-helper-for-api-messages)
34. [`hasValue()` before `value()` (resources)](#34-hasvalue-before-value-resources)
35. [Telling a 404 apart from a real error](#35-telling-a-404-apart-from-a-real-error)

**5. Login and guards**

19. [Tokens in httpOnly cookies, never in JavaScript](#19-tokens-in-httponly-cookies-never-in-javascript)
20. [Functional interceptor with one shared refresh](#20-functional-interceptor-with-one-shared-refresh)
21. [`CanMatch` guard + `returnUrl`](#21-canmatch-guard--returnurl)
22. [`CanDeactivate` guard that waits for a dialog](#22-candeactivate-guard-that-waits-for-a-dialog)

**6. State and reactivity**

23. [Signals and `computed()` for state (and no NgRx)](#23-signals-and-computed-for-state-and-no-ngrx)
24. [Signals for state, RxJS for time: `toSignal()` at the edge](#24-signals-for-state-rxjs-for-time-tosignal-at-the-edge)
25. [`effect()` + `untracked()`, and `afterRenderEffect()`](#25-effect--untracked-and-afterrendereffect)
26. [A per-row "busy" lock (`busyId`)](#26-a-per-row-busy-lock-busyid)

**7. Forms**

27. [Reactive Forms with `NonNullableFormBuilder`](#27-reactive-forms-with-nonnullableformbuilder)
28. [PATCH only the dirty fields + API errors under inputs](#28-patch-only-the-dirty-fields--api-errors-under-inputs)

**8. UI building blocks**

36. [`Title` and `Meta`: the tab title and description per page](#36-title-and-meta-the-tab-title-and-description-per-page)

29. [Our own dialog on the native `<dialog>` element](#29-our-own-dialog-on-the-native-dialog-element)
30. [A pure pipe + the sanitizer for Markdown](#30-a-pure-pipe--the-sanitizer-for-markdown)
31. [Styles: tokens, global vs component, shared partials](#31-styles-tokens-global-vs-component-shared-partials)
32. [The "stretched link" card](#32-the-stretched-link-card)

**9. Testing**

33. [Vitest + "draw once" component tests](#33-vitest--draw-once-component-tests)

---

## 1. Set-up and structure

### 1. Standalone components + `app.config.ts`
*Where:* every component, `main.ts`, `app.config.ts` · *Angular 14+ (the default since 19)*
- **Problem:** in old Angular every component had to be declared in an **NgModule**. Big apps ended up with module files that only existed to list other files, and it was hard to see what a component really used.
- **Old way:** `AppModule` with `declarations: [...]`, `imports: [...]`, `providers: [...]`; `bootstrapModule(AppModule)`.
- **What we do:** each component lists what it uses in its own `imports`; app-wide setup is a plain list of providers.
  ```ts
  @Component({ selector: 'app-posts-page', imports: [DatePipe, RouterLink], … })
  // main.ts
  bootstrapApplication(App, appConfig);
  // app.config.ts
  export const appConfig: ApplicationConfig = {
    providers: [provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor]))],
  };
  ```
- **Why:** it's how Angular works today, every file says what it depends on, and lazy loading works per component.
- **Watch out:** in older company code you'll still meet NgModules; both can live together.
- **Interview line:** *"The app is fully standalone: components declare their own imports and the app-wide providers live in `app.config.ts`."*

### 2. `inject()` instead of constructor parameters
*Where:* everywhere · *Angular 14+*
- **Problem:** constructor injection gets long, and it doesn't work in **functions** (functional guards, interceptors).
- **Old way:** `constructor(private http: HttpClient, private router: Router) {}`
- **What we do:**
  ```ts
  private readonly http = inject(HttpClient);
  ```
- **Why:** one style for classes *and* functions (our guards and interceptor are plain functions); fields read top to bottom.
- **Watch out:** `inject()` only works **while Angular is creating something** (a field, a constructor, a guard or interceptor call). Calling it later in a click handler throws.
- **Interview line:** *"I use `inject()` everywhere, which also makes functional guards and interceptors possible."*

### 3. Feature-based folders + a decision guide
*Where:* `web/src/app/` · *we agreed on this together (architecture review)*
- **Problem:** folders by **file type** (`components/`, `services/`, `models/`) scatter one feature over five folders and grow without limit.
- **Old way:** folders by type, or one giant `shared/` that everything goes into.
- **What we do:**
  ```
  core/      app-wide infrastructure (auth, interceptor, API address), no screens
  layouts/   page frames (public header/footer, admin top bar)
  shared/    reusable, no data, no feature knowledge (dialog, markdown pipe, styles)
  features/  one folder per feature (home, admin, blog), component + service + model together
  ```
  **Decision guide**, asked in order: one feature only → that feature · a frame → `layouts/` · used by 2+ features and knows no data → `shared/` · app-wide infrastructure → `core/`.
- **Why:** everything about a feature is in one place; deleting a feature = deleting one folder; the guide pushes code *down* into features first, so `shared/` stays small. It's what the Angular style guide recommends. (Example: chips moved to `shared/styles/` only when the blog became their **second** user.)
- **Watch out:** no empty folders "for later"; a folder is created with its first file.
- **Interview line:** *"Folders are by responsibility: core, layouts, shared, features, with a written rule for where each file goes."*

### 4. Path aliases (`@core/…`)
*Where:* `web/tsconfig.json`
- **Problem:** `import … from '../../../../core/auth/auth.service'` breaks when a file moves, and it's hard to read.
- **What we do:**
  ```json
  "paths": { "@core/*": ["src/app/core/*"], "@shared/*": ["src/app/shared/*"],
             "@layouts/*": ["src/app/layouts/*"], "@features/*": ["src/app/features/*"] }
  ```
  `import { AuthService } from '@core/auth/auth.service';`
- **Why:** clear and stable imports; you can see at a glance which area something comes from.
- **Watch out:** for files **inside the same feature**, keep relative imports (`../admin-posts.service`); aliases are for crossing areas. SCSS `@use` doesn't know these aliases.
- **Interview line:** *"Path aliases keep cross-area imports short and stable when files move."*

### 5. One `/api` address + an `InjectionToken`
*Where:* `core/api/api.config.ts`, `environments/`, `proxy.conf.mjs`, `vercel.json`
- **Problem:** the website and the API are two servers. Calling the API on its own address needs CORS, and the login cookies wouldn't be "same-site".
- **Old way:** `environment.apiUrl = 'https://api.example.com'` + CORS + `withCredentials: true`.
- **What we do:** Angular always calls **`/api/...` on the website's own address**; on the laptop the dev server's proxy passes it on, and live a Vercel rewrite does. The address is written once, as a token:
  ```ts
  export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
    providedIn: 'root', factory: () => environment.apiBaseUrl,   // '/api'
  });
  private readonly url = `${inject(API_BASE_URL)}/admin/posts`;
  ```
- **Why:** same-site cookies (`sameSite: strict` works), no CORS, and identical code on laptop and live. The token means a test can give a different address.
- **Watch out:** restart `npm start` after changing the proxy file.
- **Interview line:** *"The SPA calls a relative `/api`, proxied in development and rewritten in production, so cookies are first-party and CORS isn't needed."*

---

## 2. Components and templates

### 6. `OnPush` everywhere
*Where:* every component
- **Problem:** with the default setting, Angular re-checks **every component** after every click, timer or request.
- **What we do:** `changeDetection: ChangeDetectionStrategy.OnPush` in every component.
- **Why:** a component redraws only when its inputs or the **signals it reads** change. With signals this is natural and fast.
- **Watch out:** if you change a plain (non-signal) field, the screen may not update. Keep screen state in signals.
- **Interview line:** *"Every component is OnPush; with signals Angular knows exactly what changed."*

### 7. Built-in control flow (`@if`, `@for`)
*Where:* every template · *Angular 17+*
- **Old way:** `*ngIf`, `*ngFor` (with `trackBy`), which need `CommonModule` imports.
- **What we do:**
  ```html
  @if (posts.isLoading()) { … } @else if (posts.error()) { … } @else { … }
  @for (post of rows(); track post.id) { … } @empty { No posts }
  @if (notice(); as n) { {{ n.text }} }
  ```
- **Why:** easier to read (real `else if`), no imports, faster, and `track` is **required**, so lists are efficient by default.
- **Watch out:** `track` must be something unique and stable (an id or slug), not the index, if items can move.
- **Interview line:** *"I use the built-in control flow; `track` is mandatory, which avoids re-rendering whole lists."*

### 8. Signal inputs (`input()`) and signal queries (`viewChild()`)
*Where:* `section-heading`, blog list, dialog host · *Angular 17.1+ / 17.2+*
- **Old way:** `@Input() title!: string;` and `@ViewChild('el') el!: ElementRef;`
- **What we do:**
  ```ts
  readonly title = input.required<string>();                     // a signal
  readonly tag = input<string>();                                // optional
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  ```
- **Why:** they're signals, so `computed()` and effects follow them; `input.required` makes a missing input a **build error** instead of a runtime bug.
- **Watch out:** inputs are read-only inside the component; read them with `()`.
- **Interview line:** *"Inputs and view queries are signals, so derived state just uses `computed`."*

### 9. `host: {…}` instead of `@HostListener`
*Where:* header (window scroll), post editor (`beforeunload`)
- **Old way:** `@HostListener('window:scroll') onScroll() {…}`
- **What we do:**
  ```ts
  @Component({ …, host: { '(window:scroll)': 'onScroll()' } })
  ```
- **Why:** the Angular style guide prefers the `host` property; all bindings of the component's element are in one place.
- **Interview line:** *"Host listeners go in the component's `host` metadata, as the style guide recommends."*

---

## 3. Routing

### 10. Layout routes (a frame with pages inside)
*Where:* `app.routes.ts`, `admin.routes.ts`, `layouts/`
- **Problem:** the public site and the admin need **different frames** (header/footer vs admin top bar).
- **Old way:** one header in `app.component.html` with `*ngIf="!isAdmin"` tricks.
- **What we do:** a route with the frame as `component` and the pages as `children`; the frame has its own `<router-outlet>`.
  ```ts
  { path: '', component: PublicLayout, children: [
      { path: '', component: Home },
      { path: 'blog', loadChildren: () => import('@features/blog/blog.routes').then((m) => m.BLOG_ROUTES) },
  ] },
  ```
- **Why:** the root `App` stays tiny (`<router-outlet />`), and each area chooses its own frame.
- **Interview line:** *"Layouts are parent routes with their own outlet, so each area gets its own chrome."*

### 11. Lazy loading (`loadChildren`, `loadComponent`)
*Where:* `/admin`, `/blog`, every admin and blog page
- **Problem:** without it, every visitor downloads the admin editor, the Markdown library and so on, even if they only look at Home.
- **What we do:**
  ```ts
  { path: 'admin', loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: 'posts', loadComponent: () => import('./posts-page/posts-page').then((m) => m.PostsPage) },
  ```
- **Why:** a smaller first download for visitors. Home itself is **not** lazy, because every visitor needs it straight away.
- **Interview line:** *"Whole areas are `loadChildren`, pages inside them `loadComponent`; only Home is eager."*

### 12. `@defer`: load a section when it's near the screen
*Where:* `features/home/home.html` (Projects) · *Angular 17+*
- **Problem:** Projects is below the fold, but its code and API call would run on page load.
- **What we do:**
  ```html
  @defer (on viewport; prefetch on idle) { <app-projects /> }
  @placeholder { <div class="deferred-placeholder" id="work"></div> }
  ```
- **Why:** the code and the request start only when you scroll near it; `prefetch on idle` downloads the code in the background so it's ready in time. The placeholder keeps `id="work"`, so the header link still finds the spot.
- **Watch out:** the deferred component must not be referenced anywhere else eagerly, or nothing is deferred.
- **Interview line:** *"Below-the-fold sections use `@defer (on viewport; prefetch on idle)`."*

### 13. `withComponentInputBinding()`: URL values become inputs
*Where:* `app.config.ts`, blog list (M7) · *Angular 16+*
- **Problem:** a page needs values **from the address**: `:id` in `/admin/posts/7`, or `?tag=angular`.
- **Old way:** `inject(ActivatedRoute)` → `snapshot.paramMap.get('id')` (read **once**), or `queryParamMap` as an Observable you subscribe to.
- **What we do:** switch it on once, then name an `input()` like the URL value:
  ```ts
  provideRouter(routes, withComponentInputBinding())
  readonly tag = input<string>();    // ← ?tag=angular
  readonly page = input<string>();   // ← ?page=2
  ```
- **Why:** less code; the value is a **signal** that updates with the URL, so `computed` + `httpResource` refetch by themselves; the page doesn't depend on the router (easy to test).
- **Watch out:** only for the **routed** component, not its children. Values are text or `undefined`, so validate them (`?page=abc` → 1). Don't reuse a name across params, query and `data`. (The admin editor still uses `ActivatedRoute.snapshot`, written before; it could become `id = input<string>()`.)
- **Interview line:** *"Route and query params arrive as signal inputs; the page stays router-agnostic."*

### 14. The URL as the source of truth for lists
*Where:* blog list (M7, decision 1A)
- **Problem:** if the filter and page live only in the component's memory, Reload and Back forget them and you can't share "my Angular posts".
- **What we do:** the filter and page **live in the address** (`/blog?tag=angular&page=2`). Chips and Newer/Older are **links** that only change the URL; the page reads the URL (entry 13) and loads accordingly.
  ```html
  <a class="chip" routerLink="/blog" [queryParams]="{ tag: t.slug }">{{ t.name }}</a>
  <a routerLink="/blog" [queryParams]="{ tag: selectedTag(), page: 2 }">Older →</a>   <!-- null drops a param -->
  ```
- **Why:** Reload, Back/Forward and shared links all work for free; real links can be opened in a new tab and are accessible. It's the standard for lists, filters and search in company apps.
- **Watch out:** a query change counts as a navigation (scrolls to the top, entry 15). Keep page 1 and "All" out of the URL for clean addresses.
- **Interview line:** *"Anything a user might bookmark (filters, page, search) lives in the URL; the component derives its state from it."*

### 15. `withInMemoryScrolling()`: scroll like a normal website
*Where:* `app.config.ts`, header (M7)
- **Problem:** in a single-page app nothing really reloads, so a new page keeps the old scroll position, Back doesn't return you to your spot, and `/#work` from another page doesn't scroll.
- **What we do:**
  ```ts
  provideRouter(routes, withInMemoryScrolling({
    scrollPositionRestoration: 'enabled',   // new page → top; Back/Forward → where I was
    anchorScrolling: 'enabled',             // "/#work" → scroll to id="work"
  }))
  // header.ts: stop below the sticky header
  inject(ViewportScroller).setOffset(() => [0, headerElement.offsetHeight]);
  ```
  ```html
  <a routerLink="/" fragment="work">work</a>   <!-- works from every page, not only Home -->
  ```
- **Why:** expected website behaviour with two lines of setup; the header's section links now work from the blog. CSS `scroll-padding-top` only helps the browser's own `#links`, not the router's scrolling, hence `setOffset`.
- **Watch out:** filter clicks also scroll to the top; Back restores immediately, so a page that reloads its data may land slightly off.
- **Interview line:** *"I enable in-memory scrolling and anchor scrolling, with a ViewportScroller offset for the sticky header."*

### 16. Passing a one-time message during navigation (`state`)
*Where:* post editor (after creating a post)
- **Problem:** after "Create", we jump from `/admin/posts/new` to `/admin/posts/12` and want to show "Draft created." on the **new** page, without putting it in the URL.
- **What we do:**
  ```ts
  this.router.navigate(['/admin/posts', created.id], {
    replaceUrl: true,                          // Back won't return to an empty form
    state: { notice: 'Draft created. …' },     // travels with this navigation only
  });
  // on the new page:
  const passed = this.router.currentNavigation()?.extras.state?.['notice'];
  ```
- **Why:** a message for one moment doesn't belong in the URL (sharing the link shouldn't show it) or in a global service.
- **Watch out:** `currentNavigation()` only exists **during** the navigation, so read it in the constructor. After a reload the message is gone, as intended.
- **Interview line:** *"One-time UI messages travel in navigation `state`; `replaceUrl` keeps the history clean."*

---

## 4. Data and the API

### 17. `httpResource` for reads, `HttpClient` for actions
*Where:* every service · *Angular 19.2+* · **our project convention**
- **Problem:** loading data with `subscribe` means hand-writing loading / error / data fields, unsubscribing, and re-fetching when a filter changes.
- **Old way:** `this.http.get(...).subscribe(data => this.data = data)` plus `isLoading` flags, or the `async` pipe.
- **What we do:**
  ```ts
  // READ (shown on screen): signals, re-fetches when the signals it reads change
  loadProjects(category: () => string | null) {
    return httpResource<ProjectsResponse>(() => ({ url: `${this.baseUrl}/projects`, params: … }));
  }
  // in the component:  posts.value(), posts.isLoading(), posts.error(), posts.reload()

  // ACTION (on a click): explicit, nothing is sent until subscribe
  publish(id: number) { return this.http.post<AdminPost>(`${this.url}/${id}/publish`, {}); }
  ```
- **Why:** reads get loading/error for free and follow filters automatically; actions stay explicit, because you want to decide exactly when a POST is sent. Both go through the same interceptor. You asked about the service style and we fixed this as the **convention**, so every service looks the same.
- **Watch out:** read `value()` only after `hasValue()` (entry 34). `httpResource` must be created **while the component is being created** (a field), not in a click handler. Return `undefined` from its function to skip the request (as `loadPost` does for a new post).
- **Interview line:** *"Reads are `httpResource` (signals for value, loading and error, auto-refetch); writes are `HttpClient` Observables."*

### 18. One error helper for API messages
*Where:* `features/admin/api-error.ts`
- **Problem:** each page would turn HTTP errors into text differently, and server details could leak onto the screen.
- **What we do:** `apiErrorMessage(error)`: status 0 → "Can't reach the server"; 4xx → the API's own sentence + its field messages; 5xx → a generic sentence.
- **Why:** one consistent voice; only messages the API meant for users are shown.
- **Interview line:** *"A single helper maps API errors to user-facing text; 5xx details never reach the UI."*

### 34. `hasValue()` before `value()` (resources)
*Where:* every `httpResource` reader · *found while building 7b*
- **Problem:** in Angular 20+, **`resource.value()` throws an error while the resource is in its error state** (the request failed). A `computed` or template that reads `value()` too early then crashes, so instead of a friendly "Try again" box the section breaks.
- **What we do:** ask first, then read:
  ```ts
  rows = computed(() => (this.posts.hasValue() ? this.posts.value().data : []));
  ```
  ```html
  @if (tags.hasValue() ? tags.value() : null; as tagList) { … }
  ```
  Or put the `@else if (resource.error())` branch **before** any branch that reads `value()`.
- **Why:** it was a real bug in four places (Projects, the category chips, the admin posts counter, the editor). Fixed in 7b.
- **Interview line:** *"Since `value()` throws in the error state, I guard every read with `hasValue()`."*

### 35. Telling a 404 apart from a real error
*Where:* blog article page
- **Problem:** `error()` is set for "this post doesn't exist" **and** for "the server is down", but they need different screens: "Try again" is pointless for a missing post.
- **What we do:**
  ```ts
  notFound = computed(() => {
    const error = this.post.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  ```
  The template checks `notFound()` **before** the general `error()` branch.
- **Why:** an honest message ("This post doesn't exist (any more)") with a link to all posts. Drafts also answer 404, so a visitor can't even tell that a draft exists.
- **Interview line:** *"I branch on the HTTP status: 404 gets a not-found page, other errors get a retry."*

---

## 5. Login and guards

### 19. Tokens in httpOnly cookies, never in JavaScript
*Where:* the API sets them; `core/auth/auth.service.ts` · **decided in Session B (sessions vs JWT was your decision)**
- **Problem:** tokens in `localStorage` can be stolen by any injected script (XSS).
- **Old way:** save the JWT in `localStorage`; an interceptor adds `Authorization: Bearer …` to each request.
- **What we do:** the API sends two **httpOnly** cookies (access 15 min, refresh 7 days); the **browser** stores and attaches them. Angular only keeps *who* is logged in, in a signal.
- **Why:** scripts can't read httpOnly cookies, so there's nothing to steal from JavaScript. With one `/api` address (entry 5) the cookies are first-party.
- **Watch out:** Angular can't read the expiry, so the interceptor **reacts to 401** instead of checking beforehand (entry 20).
- **Interview line:** *"Tokens live in httpOnly, sameSite-strict cookies; Angular never touches them."*

### 20. Functional interceptor with one shared refresh
*Where:* `core/auth/auth.interceptor.ts` · *Angular 15+*
- **Problem:** the access token expires every 15 minutes, and several requests can fail at the same moment.
- **Old way:** a class implementing `HttpInterceptor`, registered with `HTTP_INTERCEPTORS`.
- **What we do:**
  ```ts
  let refreshInProgress: Observable<unknown> | null = null;
  export const authInterceptor: HttpInterceptorFn = (req, next) =>
    next(req).pipe(catchError((error) => {
      if (!(error.status === 401 && canRefreshFor(req))) return throwError(() => error);
      refreshInProgress ??= auth.refreshTokens().pipe(finalize(() => (refreshInProgress = null)), shareReplay(1));
      return refreshInProgress.pipe(switchMap(() => next(req)));   // retry once
    }));
  // app.config.ts
  provideHttpClient(withInterceptors([authInterceptor]))
  ```
- **Why:** "try first, fix it if it fails". Three 401s share **one** refresh (`shareReplay`); with rotation, three separate refreshes would cancel each other out. It never refreshes for login/refresh/logout (no loops). If the refresh fails → forget the user → login page with `returnUrl`.
- **Interview line:** *"A functional interceptor handles 401 with a single shared refresh, then retries the request once."*

### 21. `CanMatch` guard + `returnUrl`
*Where:* `core/auth/admin.guard.ts`
- **Problem:** visitors shouldn't open admin pages, and after login you should return to the page you wanted.
- **Old way:** `CanActivate` (the code downloads, then the page is blocked), often a class guard.
- **What we do:**
  ```ts
  export const adminGuard: CanMatchFn = (_route, segments) =>
    inject(AuthService).restore().pipe(map((ok) =>
      ok ? true : inject(Router).createUrlTree(['/admin/login'], { queryParams: { returnUrl: … } })));
  ```
- **Why:** with `CanMatch` the lazy admin code **isn't even downloaded** for outsiders; returning a `UrlTree` is a clean redirect. `restore()` asks `/me`, so a reload keeps you logged in. The login page only accepts `returnUrl`s starting with `/admin/` (**no open redirect** to other websites).
- **Watch out:** **a guard is not security.** The API's `requireAdmin` protects the data; the guard only saves outsiders from empty screens.
- **Interview line:** *"`CanMatch` keeps unauthorised users from even loading the admin bundle; real authorisation is server-side."*

### 22. `CanDeactivate` guard that waits for a dialog
*Where:* `features/admin/unsaved-changes.guard.ts` + editor
- **Problem:** leaving the editor would silently lose your typing.
- **What we do:** any page that implements `hasUnsavedChanges()` can use the guard; the guard returns our dialog's **Promise**, and the router waits.
  ```ts
  export interface HasUnsavedChanges { hasUnsavedChanges(): boolean; }
  export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (page) =>
    !page.hasUnsavedChanges() || inject(DialogService).confirm({ title: 'Leave without saving?', … });
  ```
  Closing or reloading the tab → `host: { '(window:beforeunload)': … }` → the **browser's own** box.
- **Why:** an interface keeps the guard reusable for any future form page. Guards can return a boolean, a `UrlTree`, an Observable **or a Promise**. Browsers forbid custom dialogs on tab close, so that case stays native.
- **Interview line:** *"A reusable CanDeactivate guard asks via a Promise-based dialog; `beforeunload` covers closing the tab."*

---

## 6. State and reactivity

### 23. Signals and `computed()` for state (and no NgRx)
*Where:* everywhere (`currentUser`, `busyId`, `notice`, `rows`, `suggestedSlug`, …)
- **Problem:** the screen must update when data changes, without hand-written subscriptions.
- **Old way:** `BehaviorSubject` in services + `async` pipe, or a store (NgRx).
- **What we do:**
  ```ts
  readonly currentUser = signal<AdminUser | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  ```
- **Why:** simple, synchronous, works perfectly with `OnPush`. The only app-wide state is "who's logged in", one signal in a root service, so a store would be many files for nothing.
- **Watch out:** `computed` must not change other state; it only derives. Use `.set()` / `.update()` to change a signal; never mutate an object inside it.
- **Interview line:** *"State is signals; derived values are `computed`. NgRx would be worth it only if many features shared complex state."*

### 24. Signals for state, RxJS for time: `toSignal()` at the edge
*Where:* post editor (`content`, `title`), interceptor (RxJS) · **from your question "why two signals instead of RxJS?"**
- **Problem:** a form's `valueChanges` is an Observable, but the preview is just state the template shows.
- **What we do:**
  ```ts
  protected readonly content = toSignal(this.form.controls.content.valueChanges, { initialValue: '' });
  protected readonly suggestedSlug = computed(() => toSlug(this.title()));
  ```
- **Why:** convert **at the edge**, then everything is signals: no `async` pipe, no unsubscribe, derived values in one line. **Rule of thumb: signals for state on screen; RxJS for events over time** (debounce, cancel with `switchMap`, combine, retry), which is why the interceptor stays RxJS.
- **Watch out:** if you need `debounceTime` (e.g. autosave), do it in RxJS **before** `toSignal`.
- **Interview line:** *"I convert Observables with `toSignal` at the boundary; RxJS stays where timing matters."*

### 25. `effect()` + `untracked()`, and `afterRenderEffect()`
*Where:* post editor (fill the form), dialog host (open/close)
- **Problem:** some reactions aren't "derive a value" but **do something**: put loaded data into a form, or call `showModal()` on a DOM element.
- **What we do:**
  ```ts
  effect(() => { const loaded = this.post.value(); if (loaded) untracked(() => this.fill(loaded)); });
  afterRenderEffect(() => { const open = this.dialog.request() !== null; /* showModal() / close() */ });
  ```
- **Why:** `untracked` means "react to the post arriving, but not to whatever `fill()` reads", which avoids loops. `afterRenderEffect` runs **after** Angular has drawn, so the dialog's buttons exist and `autofocus` works.
- **Watch out:** effects are the **last resort**. Prefer `computed` for values and `httpResource` for data. Never use an effect to copy one signal into another.
- **Interview line:** *"Effects only for side effects (form filling, DOM calls), with `untracked` to avoid accidental dependencies."*

### 26. A per-row "busy" lock (`busyId`)
*Where:* posts table · **from your `busyId` / `exhaustMap` question**
- **Problem:** a double click on Publish would send two requests.
- **What we do:** `busyId = signal<number | null>(null)`: set when a row's action starts, cleared when the API answers; that row's buttons are disabled and it dims.
- **Why:** it **shows** the lock (a disabled button) and works per row. RxJS `exhaustMap` gives the same "first click wins" but silently, inside a stream; real projects often use both.
- **Interview line:** *"A per-row busy signal disables actions while a request runs, the visible version of `exhaustMap`."*

---

## 7. Forms

### 27. Reactive Forms with `NonNullableFormBuilder`
*Where:* contact, login, editor · **decision: Reactive Forms, not Signal Forms (yet)**
- **Problem:** with the normal builder, a reset field becomes `null`, so types turn into `string | null` everywhere.
- **What we do:**
  ```ts
  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
  });
  // on submit: if invalid → form.markAllAsTouched(); errors show once a field is touched
  ```
- **Why:** simple `string` types; errors appear after touching or submitting, not while typing the first letter. **Signal Forms** (`form()` from `@angular/forms/signals`) are stable since Angular 22, but we stay with Reactive Forms: most company code uses them, and one form system per app is consistent. Migrating the login form is an optional exercise after go-live.
- **Interview line:** *"Typed, non-nullable Reactive Forms; Signal Forms are the future, and I'd migrate gradually, starting with simple forms."*

### 28. PATCH only the dirty fields + API errors under inputs
*Where:* post editor
- **Problem:** sending the whole post on every save overwrites things you didn't touch, and the API's field errors need to reach the right input.
- **What we do:**
  ```ts
  if (c.title.dirty) changes.title = c.title.value;   // …per field → PATCH body
  // on 400/409: this.serverErrors.set(error.error.fields) → shown under each input
  // after a load or save: form.reset(post) → everything "pristine" again
  ```
- **Why:** **dirty** = changed since the last load or save. The same flag powers the leave guard (only ask if dirty). The client checks mirror the API's Zod rules for quick feedback, but the **API's rules are the ones that count**.
- **Interview line:** *"One editor for create and edit: no id = POST the whole form; an id = PATCH the dirty fields; server field errors map onto the inputs."*

---

## 8. UI building blocks

### 36. `Title` and `Meta`: the tab title and description per page
*Where:* blog article page · *`@angular/platform-browser`*
- **Mental model:** every web page has a hidden **label** in `<head>` (in our `index.html`): `<title>` is the text on the **browser tab** (and in bookmarks and history); `<meta name="description">` is the **short summary** Google and link previews show. Angular has **one** `index.html`, so without help every page carries the **same** label.
- **Old way / simple way:** a fixed `title: 'Blog · …'` on the route (we use that too). It can't know a post's title, which arrives from the API later.
- **What we do:** two small Angular services that **rewrite the label**:
  ```ts
  inject(Title).setTitle(`${post.title} · Devaangini Mehta`);              // → <title>
  inject(Meta).updateTag({ name: 'description', content: post.excerpt });   // → <meta name="description">
  ```
  in an `effect` that runs when the post arrives; on leaving the page (`DestroyRef.onDestroy`) the site's own description is put back.
- **Why:** the tab, bookmarks, history and shared links show the real post title; search engines read the summary.
- **Watch out:** routes with a `title` overwrite the tab title on every navigation (fine); the description has no such reset, hence the `onDestroy`. Without SSR/prerendering, link previews (WhatsApp, LinkedIn) still see `index.html`'s label, because they don't run JavaScript.
- **Interview line:** *"Dynamic pages set their own title and meta description with the `Title` and `Meta` services once the data arrives."*


### 29. Our own dialog on the native `<dialog>` element
*Where:* `shared/ui/dialog/` · **your request: no browser popups; option A chosen**
- **Problem:** `window.confirm` can't be styled, looks different in every browser and freezes the page.
- **Options we compared:** A native `<dialog>` + our service (chosen) · B Angular CDK Dialog · C a hand-made `<div>` overlay.
- **What we do:**
  ```ts
  const ok = await this.dialog.confirm({ title: 'Delete this post?', message: …, confirmText: 'Delete', danger: true });
  ```
  The service keeps the question in a **signal** and returns a **Promise**; one `<app-dialog-host>` in `app.html` calls `showModal()`.
- **Why:** our own look, no package, and the browser gives the backdrop, focus trap and Esc for free. The "no" button gets the focus first. **Dialogs are for decisions**; "Saved" stays a small notice. CDK Dialog is the choice for big apps with many dialogs.
- **Watch out:** closing or reloading the tab can only use the browser's own box.
- **Interview line:** *"One shared confirm dialog on the native `<dialog>`: a root service holds the question in a signal and returns a Promise."*

### 30. A pure pipe + the sanitizer for Markdown
*Where:* `shared/pipes/markdown.pipe.ts`, editor preview, blog article (7b)
- **Problem:** turn Markdown into HTML **safely**: a post could contain `<script>` or `onerror=…`.
- **What we do:**
  ```html
  <div class="prose" [innerHTML]="content() | markdown"></div>
  ```
  The pipe uses `marked`; `[innerHTML]` always runs **Angular's sanitizer**, which removes scripts, event handlers and `javascript:` links.
- **Why:** a **pure** pipe runs only when the text changes; safety comes from the binding, so we **never** use `bypassSecurityTrustHtml`. Shared, because the editor preview and the blog must look identical.
- **Interview line:** *"Markdown is rendered with a pure pipe and bound via `[innerHTML]`, so Angular's sanitizer prevents XSS."*

### 31. Styles: tokens, global vs component, shared partials
*Where:* `src/styles.scss`, component `.scss` files, `shared/styles/`
- **What we do:**
  - **Design tokens** on `:root`: `--color-ink`, `--color-accent`, `--font-display`, …; components use `var(--…)`, never hard-coded colours.
  - **Global styles** only for true basics: `.container`, `.btn`, `.visually-hidden`, `.lift`, `.prose` (rendered Markdown isn't part of any template, so component styles can't reach it).
  - **Component styles** are encapsulated: they can't leak into other components.
  - **Shared partials** with `@use`: `forms.scss`, `chips.scss`, `states.scss` (pulled into each component that needs them).
- **Why:** one place to change the look; no style collisions; shared pieces only when 2+ features use them (the decision guide).
- **Watch out:** Sass `@use` must be the first rule in a file.
- **Interview line:** *"CSS custom properties as tokens, encapsulated component styles, and a few global primitives."*

### 32. The "stretched link" card
*Where:* blog list cards
- **Problem:** the whole card should be clickable, but wrapping everything in one `<a>` makes screen readers read the entire card as one long link.
- **What we do:** only the **title** is a link; its `::before` is stretched over the card (`position: absolute; inset: 0`, with the card `position: relative`). The focus ring is moved to the card with `:has(:focus-visible)`.
- **Why:** click anywhere, but one short link per post for keyboard and screen reader users.
- **Interview line:** *"Cards use the stretched-link pattern: one accessible link, the whole card clickable."*

---

## 9. Testing

### 33. Vitest + "draw once" component tests
*Where:* `*.spec.ts`, `npm test` in `web/`
- **What we do:** Angular's test runner with **Vitest**; services tested directly (`TestBed.inject`), components rendered with `fixture.detectChanges()` and checked in the DOM.
- **Why:** fast tests. **Lesson learned:** components that start real API requests must not wait with `whenStable()`, because the requests are never answered in a test and it waits forever. Drawing once is enough to check what's on screen.
- **Next:** `HttpTestingController` tests for services and the interceptor (e.g. "three 401s → one refresh").
- **Interview line:** *"Vitest for unit tests; components are tested through the DOM; HTTP is tested with `HttpTestingController`."*
