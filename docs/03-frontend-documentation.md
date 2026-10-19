# 03 — Frontend (Angular web app)

[← 02 Architecture](02-system-architecture.md) · [Docs home](README.md) · Next: [04 — API](04-api-documentation.md)

## In plain English

The web app is the part people see. It is one page split into sections (header, hero, numbers, "What I do", projects). Most sections show text written directly in the code. The **Projects** section is different: when it comes into view, it asks the API for the projects and draws a card for each one. Clicking a category chip asks again, for just that category.

## A. Fundamentals

| Topic | What the project does | Where |
|---|---|---|
| Framework | Angular 22, standalone components, TypeScript ~6.0 | `web/package.json` |
| Entry point | `bootstrapApplication(App, appConfig)` | `web/src/main.ts` |
| App-wide providers | `provideBrowserGlobalErrorListeners()`, `provideRouter(routes)`, `provideHttpClient()` | `web/src/app/app.config.ts` |
| Routing | Router is set up but **no routes** exist; the site is one page and uses `#anchor` links | `web/src/app/app.routes.ts` |
| Root layout | Skip link → header → `<main>` with the sections | `web/src/app/app.html` |
| Change detection | `ChangeDetectionStrategy.OnPush` on every component | each `*.ts` |
| State | Signals: `signal`, `computed`, `linkedSignal`; data via `httpResource` | Projects section |
| Styling | SCSS; design tokens as CSS variables in `styles.scss`; each component has its own `.scss` | `web/src/styles.scss` |
| Fonts | Plus Jakarta Sans (text), IBM Plex Mono (labels), from Google Fonts | `web/src/index.html` |
| Static files | Everything in `web/public/` is served from the site root (e.g. the CV) | `angular.json` → `assets` |
| Lazy loading | Projects section wrapped in `@defer (on viewport; prefetch on idle)` | `app.html` |
| Accessibility | Skip link, visible focus ring, `aria-labelledby` on sections, real `<button>`s with `aria-pressed` for chips, `role="status"`/`role="alert"` for loading/error, decorative icons `aria-hidden` | various |
| Motion | Entrance and scroll-reveal animations in CSS only, all inside `@media (prefers-reduced-motion: no-preference)` | `styles.scss`, `hero.scss` |

### How the app starts

1. The browser loads `index.html`, which contains `<app-root>`.
2. `main.ts` calls `bootstrapApplication(App, appConfig)`.
3. `appConfig` registers `HttpClient` (needed by `httpResource`).
4. `App` renders `app.html`: header, hero, impact strip, expertise, and a **placeholder** where projects will go.
5. When the placeholder scrolls near the viewport, Angular downloads the Projects code and renders it. "Prefetch on idle" downloads that code in the background earlier, as soon as the browser is free.

## B. Folder-by-folder

```text
web/src/
├── index.html            page shell, <title>, fonts
├── main.ts               bootstraps the app
├── styles.scss           global tokens and utilities
└── app/
    ├── app.ts / .html / .scss     root component and page layout
    ├── app.config.ts              providers (HttpClient, router)
    ├── app.routes.ts              empty route list
    ├── project.ts                 TypeScript types for API data
    ├── core/
    │   ├── api.config.ts          API_BASE_URL injection token
    │   └── projects.service.ts    calls the projects endpoints
    ├── layout/
    │   └── header/                sticky header and navigation
    ├── shared/
    │   └── section-heading/       reusable "01 · Label" + title
    └── sections/
        ├── hero/                  headline, intro, Download CV
        ├── impact-strip/          four headline numbers
        ├── expertise/             "What I do" cards
        └── projects/              projects list + category chips
```

### Key files

| File | Responsibility | Depends on | Used by |
|---|---|---|---|
| `app/project.ts` | `Project` and `ProjectsResponse` interfaces, matching the API JSON | — | service, Projects component |
| `core/api.config.ts` | `API_BASE_URL` token, default `http://localhost:3000/api` | — | `ProjectsService` |
| `core/projects.service.ts` | `loadProjects(category)` and `loadCategories()`, each returning an `httpResource` | `API_BASE_URL`, `HttpClient` | Projects component |
| `shared/section-heading/section-heading.ts` | Inputs `index`, `eyebrow`, `title`, `headingId` (required), `tone` (`'light' \| 'dark'`) | — | Expertise, Projects |
| `layout/header/header.ts` | Nav items array; `scrolled` signal adds a shadow after scrolling | — | `App` |
| `sections/hero/hero.ts` | `cv` object (path, download name, size) | — | `App` |
| `sections/impact-strip/impact-strip.ts` | `stats` array rendered with `@for` | — | `App` |
| `sections/expertise/expertise.ts` | `areas` array; icon chosen with `@switch` | `SectionHeading` | `App` |
| `sections/projects/projects.ts` | Selected chip, data resources, featured/others split | `ProjectsService`, `SectionHeading`, `NgTemplateOutlet` | `App` (deferred) |

## C. Features

### 1. Header — static ✅
Sticky bar with the "DM" mark, name and role, nav links and a Contact button. The links are generated from `navItems` with `@for`. On phones (≤ 640px) only the brand and Contact button show.

⚠️ Known gap: nav links point to `#experience` and `#skills`, and there is a Contact button for `#contact`, but **those sections don't exist yet**, so the links do nothing.

### 2. Hero and CV download — static ✅
Headline, intro, location, **Download CV** and **View my work** buttons. The CV link is:

```html
<a class="btn btn--light" [href]="cv.path" [attr.download]="cv.downloadName">
```

`[attr.download]` is needed because `download` is an HTML attribute, not a DOM property. The file is `web/public/Devaangini-Mehta-CV.pdf`; replace it with the same name to update the CV, with no code change.

### 3. Impact strip and expertise — static ✅
Data arrays in the component class, rendered with `@for`. The strip uses `grid-template-columns: repeat(auto-fit, minmax(210px, 1fr))`, giving 4, 2 or 1 columns with no media queries.

### 4. Projects with category chips — from the API ✅

**What it does:** shows the projects from the database, the first one large ("featured") and the rest in a grid. Chips filter by category.

**Step by step:**

1. `Projects` is created. Its field initializers run:
   - `selectedCategory = signal<string | null>(null)`, where `null` means "All".
   - `categories = projectsService.loadCategories()` → `GET /api/projects/categories`.
   - `resource = projectsService.loadProjects(this.selectedCategory)` → `GET /api/projects`.
2. The chips render from `categories.value()`: an **All** chip plus one per category.
3. When the visitor clicks **Payments**, `selectCategory('Payments')` sets the signal.
4. `httpResource` re-runs its request function **because a signal it reads changed**, and sends `GET /api/projects?category=Payments`. No manual subscribe is needed.
5. While loading, the old cards stay visible and dimmed (`.results--loading`, `aria-busy`). This works because `list` is a `linkedSignal` that keeps its previous value until new data arrives:

```ts
private readonly list = linkedSignal<Project[] | undefined, Project[]>({
  source: () => this.resource.value()?.data,
  computation: (data, previous) => data ?? previous?.value ?? [],
});
```

6. New data arrives → `list` updates → `featured` (first item) and `others` (the rest) recompute → the template re-renders.

**States:**

| State | Condition | What shows |
|---|---|---|
| First load | `resource.isLoading()` and nothing loaded yet (`firstLoad()`) | Grey shimmer skeletons and a hidden "Loading projects…" for screen readers |
| Error | `resource.error()` | "Projects couldn't be loaded." and a **Try again** button (`resource.reload()`) |
| Data | `featured()` exists | Featured card and grid |
| Empty | No projects | "No projects to show yet." |
| Refetching | `resource.isLoading()` with data on screen | Same cards, dimmed |

If the categories request fails, the chips are simply not shown and the projects still work.

Removed for now 📝: the "My role" line and the metrics row on cards (the API does not provide them yet).

## D. A frontend request, end to end

`web/src/app/core/projects.service.ts`:

```ts
loadProjects(category: () => string | null) {
  return httpResource<ProjectsResponse>(() => {
    const selected = category();                                   // 1
    const params: Record<string, string> = selected ? { category: selected } : {};  // 2
    return { url: `${this.baseUrl}/projects`, params };            // 3
  });
}
```

1. Reads the signal. Because it is read **inside** the request function, Angular tracks it, and any change re-runs this function.
2. Builds the query parameters: none for "All", `category=…` otherwise.
3. Returns the request description. `httpResource` turns it into `GET http://localhost:3000/api/projects?category=Payments`, sends it through `HttpClient`, and exposes the result as signals: `value()`, `isLoading()`, `error()`, `reload()`.

`httpResource` must be created in an injection context. That's why the component calls these methods in **field initializers**, not inside a click handler.

The response handling is in the component (section C above). The server side of this same request is traced in [06](06-end-to-end-data-flow.md).

## Performance notes

- `@defer (on viewport; prefetch on idle)`: the Projects code and its API calls don't block the first paint.
- OnPush everywhere and signals mean only the affected parts re-render.
- Animations are CSS-only. The scroll reveal uses `animation-timeline: view()` (no scroll listeners) inside `@supports`, so unsupported browsers simply show the content.
- Images (when added) use `loading="lazy"`.
