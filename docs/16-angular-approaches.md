# 16 — Angular Approaches Playbook

[← Docs home](README.md)

**Every Angular approach that was new to me while building this portfolio, written so I can reuse it in another project.** Each one answers: *What problem? How was it done before? What does it do instead? Why choose it? What to watch out for? How do I copy it?*

How the whole app fits together is in [15 — Frontend handbook](15-frontend-handbook.md). This page is the "toolbox".

---

## Contents
- [A. `withComponentInputBinding()`: URL values become inputs](#a-withcomponentinputbinding-url-values-become-inputs) (M7)
- [B. `withInMemoryScrolling()`: scroll like a normal website](#b-withinmemoryscrolling-scroll-like-a-normal-website) (M7)
- [Already used earlier (short index)](#already-used-earlier-short-index)

---

## A. `withComponentInputBinding()`: URL values become inputs
*Added in Milestone 7a (blog list). Angular 16+.*

**The problem.** A page often needs a value **from the address**:
- `/admin/posts/7` → "which post?" (a **route param**, `:id`)
- `/blog?tag=angular&page=2` → "which tag, which page?" (**query params**)

**Without it (the classic way).** The page asks the router itself:
```ts
private readonly route = inject(ActivatedRoute);

// once, at the start (doesn't notice later changes):
id = this.route.snapshot.paramMap.get('id');

// or, to follow changes, an Observable you must subscribe to or convert:
tag = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('tag'))));
```

**With it.** Switch it on **once**, then every routed page just declares an `input()` **with the same name** as the URL value, and the router fills it in and updates it whenever the URL changes:
```ts
// app.config.ts (once per app)
provideRouter(routes, withComponentInputBinding())

// any routed page
export class BlogListPage {
  readonly tag = input<string>();   // ← ?tag=angular
  readonly page = input<string>();  // ← ?page=2
}
// in another page:  readonly id = input<string>();   ← /posts/:id
```

**Why I chose it**
- **Less code:** no `ActivatedRoute`, no `subscribe`, no `snapshot`.
- **It's a signal**, so `computed()` and `httpResource` react to it automatically. A new URL means a new request, without me writing anything for it.
- **The page doesn't depend on the router:** it just has inputs. In a test you simply set the input; no fake router is needed.
- It's the modern Angular way (Angular 16+).

**Watch out**
- It works only for the **routed** component (the one a route loads), not for its children. Pass values down to children as normal inputs.
- URL values are always **text** (`"2"`, not `2`) or `undefined` when missing. Convert and validate them, e.g. `?page=abc` → page 1 (see `currentPage` in the blog list).
- Don't use the **same name** for a path param, a query param and route `data` in one route, or it's unclear which one wins.
- Inputs are read-only: to *change* the URL, use a `routerLink` or `router.navigate`, never "set" the input.

**Reuse it in another project:** add `withComponentInputBinding()` to `provideRouter(...)`, then use `input()`s named after your params.

**Interview line:** *"I enable `withComponentInputBinding` so route and query params arrive as signal inputs. The page stays router-agnostic and easy to test, and `httpResource` refetches automatically when the URL changes."*

> **In this project:** the blog list uses it. The admin editor still reads `:id` with `ActivatedRoute.snapshot` (written before we enabled binding); it could become `id = input<string>()` for consistency.

---

## B. `withInMemoryScrolling()`: scroll like a normal website
*Added in Milestone 7a (blog list + header links).*

**The problem.** An Angular app is a **single-page app**: moving to another page doesn't really load a new page, Angular just swaps the content. So the browser's normal scrolling habits **don't happen by themselves**:
1. You scroll down the blog list and open a post, and **the post opens scrolled down too**, in the middle of the text.
2. You press **Back**, and you don't return to the spot where you were.
3. A link to `/#work` from another page **doesn't scroll** to the Projects section.

**Without it.** Angular's default is to do nothing about scrolling. People wrote their own `window.scrollTo(0, 0)` on every navigation.

**With it.** Two switches, set once:
```ts
// app.config.ts
provideRouter(
  routes,
  withInMemoryScrolling({
    scrollPositionRestoration: 'enabled', // new page → top; Back/Forward → where I was
    anchorScrolling: 'enabled',           // "/#work" → scroll to the element with id="work"
  }),
)
```
| Setting | Options | What it means |
|---|---|---|
| `scrollPositionRestoration` | `'disabled'` (default) · `'top'` · **`'enabled'`** | `'top'` = always go to the top; `'enabled'` = top for new pages, **and** remember the position for Back/Forward ("in memory") |
| `anchorScrolling` | `'disabled'` (default) · **`'enabled'`** | a `#fragment` in the URL scrolls to the matching `id` |

**The companion piece: a sticky header.** The router scrolls the section to the **very top** of the window, under a sticky header. So the header tells the router its height once:
```ts
// header.ts
inject(ViewportScroller).setOffset(() => [0, headerElement.offsetHeight]);
```
(The CSS `scroll-padding-top` only helps the browser's own `#links`, not the router's scrolling. That's why both exist.)

**And the links.** For a link to a section that works **from every page**, use the router, not a plain `href="#work"`:
```html
<a routerLink="/" fragment="work">work</a>   <!-- go to Home, then scroll to #work -->
```

**Why I chose it**
- The site behaves the way people expect from a website.
- The header's section links now work from the blog too.
- It's two lines of setup instead of hand-written scroll code.

**Watch out**
- Changing only the **query** (e.g. a filter chip) also counts as a navigation, so the page scrolls to the top. That's fine for page buttons; for a filter far down a long page you might not want it.
- Back restores the position **immediately**. If the old page loads its data again first, the position can be slightly off. (A known limit; fine for our pages.)
- Clicking the same `#section` link twice still scrolls again: Angular handles that case.

**Reuse it in another project:** add `withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })`; if there's a sticky header, add `ViewportScroller.setOffset`; use `routerLink` + `fragment` for section links.

**Interview line:** *"In a SPA the router controls scrolling, so I enable `withInMemoryScrolling`: new pages start at the top, Back restores the position, and fragment links scroll to sections. With a sticky header I set the `ViewportScroller` offset."*

---

## Already used earlier (short index)
Each was explained when we built it; the details are in the [frontend handbook](15-frontend-handbook.md).

| Approach | Problem it solves | Where / handbook |
|---|---|---|
| Standalone components + `OnPush` | no NgModules; redraw only what changed | everywhere · §2, §8 |
| Feature folders (`core`/`layouts`/`shared`/`features`) + path aliases | find and move code easily | `tsconfig.json` · §3 |
| Layout routes (a frame with child pages) | different header/footer per area | `app.routes.ts` · §4 |
| Lazy `loadChildren` / `loadComponent` | visitors don't download admin code | routes · §4 |
| `@defer (on viewport; prefetch on idle)` | load a section only when it's near the screen | Home → Projects · §4 |
| `httpResource` for reads, `HttpClient` for actions | API data as signals; explicit clicks | all services · §5 |
| `InjectionToken` for the API address | write `/api` once | `core/api/api.config.ts` · §5 |
| Functional interceptor with **one shared refresh** | renew login on 401 without races | `core/auth/auth.interceptor.ts` · §6 |
| `CanMatch` guard returning a `UrlTree` | block and don't even download; redirect with `returnUrl` | `core/auth/admin.guard.ts` · §6 |
| `CanDeactivate` guard returning a **Promise** | "leave without saving?" with our own dialog | `unsaved-changes.guard.ts` · §7.3 |
| `toSignal(valueChanges)` + `computed` | live preview, suggested slug | editor · §8 |
| `effect` + `untracked` | fill a form once data arrives | editor · §7.2 |
| `afterRenderEffect` | DOM work after Angular has drawn | dialog host · §8 |
| Native `<dialog>` + a root service returning a Promise | an app-wide confirm dialog, accessible for free | `shared/ui/dialog/` · §7.4 |
| `NonNullableFormBuilder`, dirty/pristine | simple form types; PATCH only changes | forms · §9 |
| Pure pipe + `[innerHTML]` sanitizer | render Markdown safely | `shared/pipes/markdown.pipe.ts` · §10 |
| `host: { '(window:beforeunload)': … }` | events on window without `@HostListener` | editor · §7.3 |
