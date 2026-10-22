# 03 — Frontend (Angular web app)

[← 02 Architecture](02-system-architecture.md) · [Docs home](README.md) · Next: [04 — API](04-api-documentation.md)

## In plain English

The web app is the part people see. It is one page split into sections: header, hero, numbers, "What I do", projects, experience, skills, contact and footer. Some sections show text written directly in the code. **Projects, Experience and Skills** ask the API for their content when they appear. The **Contact** section works the other way round: it sends the visitor's message *to* the API.

## A. Fundamentals

| Topic | What the project does | Where |
|---|---|---|
| Framework | Angular 22, standalone components, TypeScript ~6.0 | `web/package.json` |
| Entry point | `bootstrapApplication(App, appConfig)` | `web/src/main.ts` |
| App-wide providers | `provideBrowserGlobalErrorListeners()`, `provideRouter(routes)`, `provideHttpClient()` | `web/src/app/app.config.ts` |
| Routing | Router is set up but **no routes** exist; the site is one page and uses `#anchor` links | `web/src/app/app.routes.ts` |
| Root layout | Skip link → header → `<main>` with the sections → footer | `web/src/app/app.html` |
| Change detection | `ChangeDetectionStrategy.OnPush` on every component | each `*.ts` |
| State | Signals: `signal`, `computed`, `linkedSignal`; reading via `httpResource`; the form via Reactive Forms | sections |
| Styling | SCSS; colour/font/size **tokens** as CSS variables plus shared helper classes in `styles.scss`; each component has its own `.scss` | `web/src/styles.scss` |
| Look | "Light & Calm": warm off-white page, navy text, apricot accent | design board J |
| Fonts | **Nunito** (headings), **Nunito Sans** (text), **JetBrains Mono** (small code-style labels), from Google Fonts | `web/src/index.html` |
| Static files | Everything in `web/public/` is served from the site root: CV, `headshot.jpg`, favicons | `angular.json` → `assets` |
| Favicon | A code-style `</>` icon: `favicon.svg` (sharp at any size), `favicon.ico` (older browsers), `apple-touch-icon.png` (home screens) | `web/public/`, linked in `index.html` |
| Lazy loading | Projects section wrapped in `@defer (on viewport; prefetch on idle)` | `app.html` |
| Accessibility | Skip link, visible focus ring, `aria-labelledby` on sections, real `<button>`s with `aria-pressed` for chips, `role="status"`/`role="alert"` for loading/error, labelled form fields with `aria-invalid` + `aria-describedby`, decorative pieces `aria-hidden` | various |
| Motion | CSS-only animations, all inside `@media (prefers-reduced-motion: no-preference)` (see section E) | `styles.scss` + component styles |

### How the app starts

1. The browser loads `index.html`, which contains `<app-root>`.
2. `main.ts` calls `bootstrapApplication(App, appConfig)`.
3. `appConfig` registers `HttpClient` (needed by `httpResource` and the contact form).
4. `App` renders `app.html`. Experience and Skills start their API requests straight away; Projects waits behind a **placeholder**.
5. When the placeholder scrolls near the viewport, Angular downloads the Projects code and renders it. "Prefetch on idle" downloads that code in the background earlier, as soon as the browser is free.

## B. Folder-by-folder

```text
web/src/
├── index.html            page shell, <title>, fonts, favicon links
├── main.ts               bootstraps the app
├── styles.scss           tokens + shared helpers (.btn, .lift, .arrow, .reveal, .pop, .stagger …)
└── app/
    ├── app.ts / .html / .scss     root component and page layout
    ├── app.config.ts              providers (HttpClient, router)
    ├── app.routes.ts              empty route list
    ├── app.spec.ts                unit tests
    ├── project.ts                 interfaces for /projects JSON
    ├── experience.ts              interface for /experience JSON
    ├── skill.ts                   interface for /skills JSON
    ├── contact.ts                 what the form sends + the 400 reply
    ├── core/
    │   ├── api.config.ts          API_BASE_URL injection token
    │   ├── projects.service.ts    GET projects + categories
    │   ├── experience.service.ts  GET experience
    │   ├── skills.service.ts      GET skills
    │   └── contact.service.ts     POST contact
    ├── layout/
    │   ├── header/                sticky header, numbered nav, scroll progress bar
    │   └── footer/                copyright + tech line
    ├── shared/
    │   └── section-heading/       "01. Title ────" heading used by sections
    └── sections/
        ├── hero/                  "Hi, my name is", typing headline, photo, Download CV
        ├── impact-strip/          four headline numbers
        ├── expertise/             "What I do" cards
        ├── projects/              projects list + category chips
        ├── experience/            timeline + recognition/education cards
        ├── skills/                skill groups as "folders" with chips
        └── contact/               "Let's talk." + contact form
```

### Key files

| File | Responsibility | Used by |
|---|---|---|
| `core/api.config.ts` | `API_BASE_URL` token, default `http://localhost:3000/api` | every service |
| `core/projects.service.ts` | `loadProjects(category)` and `loadCategories()`, each an `httpResource` | Projects |
| `core/experience.service.ts` | `loadExperiences()` → `httpResource<Experience[]>` | Experience |
| `core/skills.service.ts` | `loadSkillGroups()` → `httpResource<SkillGroup[]>` | Skills |
| `core/contact.service.ts` | `send(body)` → `HttpClient.post` (a one-off action, so not `httpResource`) | Contact |
| `shared/section-heading/section-heading.ts` | Inputs `index`, `title`, `headingId` (all required); draws "01. Title" plus a line | Expertise, Projects, Experience, Skills |
| `layout/header/header.ts` | `allNavItems` with a `ready` flag; numbers them "01".."04"; `scrolled` signal adds a shadow | `App` |
| `sections/hero/hero.ts` | `cv` object (path, download name) | `App` |
| `sections/impact-strip/impact-strip.ts` | `stats` with an `outlined` flag | `App` |
| `sections/expertise/expertise.ts` | `areas` with a `tag` (shown as `// tag`), title and description | `App` |
| `sections/experience/experience.ts` | `roles` from the API; `highlights` (recognition, education) static | `App` |
| `sections/skills/skills.ts` | `groups` from the API; `folders` = the same groups plus a label like `state-and-reactivity/` | `App` |
| `sections/contact/contact.ts` | Reactive form, `status` signal, server field errors | `App` |

## C. Features

### 1. Header — static ✅
Name with an apricot full stop, numbered code-style links (`01. expertise` … `04. skills`) and a **Let's talk** button. Links are generated from `navItems`; a link only shows when its section exists (`ready: true`). On phones (≤ 720px) only the name and the button show.

### 2. Hero and CV download — static ✅
"Hi, my name is / Devaangini Mehta. / I build Angular apps_", intro, **Download CV** and **See my work** buttons, and the round photo (`web/public/headshot.jpg`). The CV link is:

```html
<a class="btn btn--primary download" [href]="cv.path" [attr.download]="cv.downloadName">
```

`[attr.download]` is needed because `download` is an HTML attribute, not a DOM property. Replace `web/public/Devaangini-Mehta-CV.pdf` (same name) to update the CV; replace `headshot.jpg` (square, about 600×600) to change the photo.

### 3. Numbers and "What I do" — static ✅
Data arrays in the component classes, rendered with `@for`. Grids use `repeat(auto-fit, minmax(…, 1fr))`, which gives 4, 2 or 1 columns with no media queries.

### 4. Projects with category chips — from the API ✅

**What it does:** shows the projects from the database, the first one large ("featured") and the rest in a grid. Chips filter by category.

1. `Projects` is created. Its field initializers run:
   - `selectedCategory = signal<string | null>(null)`, where `null` means "All".
   - `categories = projectsService.loadCategories()` → `GET /api/projects/categories`.
   - `resource = projectsService.loadProjects(this.selectedCategory)` → `GET /api/projects`.
2. The chips render from `categories.value()`: an **All** chip plus one per category.
3. Clicking **Payments** calls `selectCategory('Payments')`, which sets the signal.
4. `httpResource` re-runs its request **because a signal it reads changed**: `GET /api/projects?category=Payments`. No manual subscribe is needed.
5. While loading, the old cards stay visible and dimmed, because `list` is a `linkedSignal` that keeps its previous value until new data arrives:

```ts
private readonly list = linkedSignal<Project[] | undefined, Project[]>({
  source: () => this.resource.value()?.data,
  computation: (data, previous) => data ?? previous?.value ?? [],
});
```

6. New data arrives → `featured` (first item) and `others` (the rest) recompute → the template re-renders. Card labels read like `featured · payments`.

| State | What shows |
|---|---|
| First load | Warm shimmer skeletons + hidden "Loading projects…" for screen readers |
| Error | "Projects couldn't be loaded." + **Try again** (`resource.reload()`) |
| Data | Featured card and grid |
| Empty | "No projects to show yet." |
| Refetching | Same cards, dimmed |

### 5. Experience — from the API ✅
`roles = inject(ExperienceService).loadExperiences()`. The API already sends the jobs newest first. Each job shows dates, title, company and summary on a timeline; the first (current) job gets the apricot pulsing dot.

Dates arrive as text such as `"2024-05-01T00:00:00.000Z"` (JSON has no date type) and are formatted with the `date` pipe:

```html
{{ role.startDate | date: 'MMM y' : 'UTC' }} –
{{ role.endDate ? (role.endDate | date: 'MMM y' : 'UTC') : 'Present' }}
```

`'UTC'` stops the visitor's time zone from shifting a date into the previous month; a `null` end date means the current job. The **Recognition** and **Education** cards are static in `experience.ts`. Loading and error states work like Projects.

### 6. Skills — from the API ✅
`groups = inject(SkillsService).loadSkillGroups()`. Each group arrives **with its skills already nested inside** (see [04](04-api-documentation.md)), so the template simply loops twice: `@for` over groups, then `@for` over `group.skills`. A `computed` adds a folder-style label (`"State & reactivity"` → `state-and-reactivity/`); screen readers still hear the real name. Core groups get peach chips.

### 7. Contact form — sends to the API ✅
- A **Reactive Form** (`NonNullableFormBuilder`) with `name`, `email`, `message` and a hidden spam field `website`. Validators mirror the API: required, email format, max lengths 100 / 254 / 2000.
- A `status` signal: `idle → sending → sent / error`. The button is disabled and says "Sending…" while sending.
- On **Send**:
  1. If the form is invalid → `markAllAsTouched()` shows every error; nothing is sent.
  2. Otherwise `contactService.send(form.getRawValue())` → `POST /api/contact`.
  3. **201** → "Thanks, your message was sent." with a **Send another message** button.
  4. **400** → the API's `fields` messages appear under the matching inputs.
  5. Anything else (API down, 500) → a red box: "Something went wrong… email me directly."
- Why `HttpClient.post` and not `httpResource`: `httpResource` is for **reading** data that loads on its own; sending a form is a one-off action triggered by a click.

### 8. Footer — static ✅
"© 2026 Devaangini Mehta" and "Built with Angular · Node.js · PostgreSQL".

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
3. Returns the request description. `httpResource` sends it through `HttpClient` and exposes the result as signals: `value()`, `isLoading()`, `error()`, `reload()`.

`httpResource` must be created in an injection context. That's why components call these methods in **field initializers**, not inside a click handler.

## E. Styles and animations

**Shared helpers in `styles.scss`** (used by many sections):

| Class | What it does |
|---|---|
| `.btn` + `--primary` / `--navy` / `--outline` | Buttons; filled ones get a soft light **sheen** on hover |
| `.arrow` | The `→` inside slides right on hover |
| `.lift` | Card hover: lifts, apricot border, a bar sweeps along the bottom |
| `.mono-label` | Small code-style label, e.g. `// performance` |
| `.reveal` | Fades up as it scrolls into view |
| `.stagger` (on a list) | Its `.reveal` children arrive one after another |
| `.pop` | Scales in as it scrolls into view (skill chips) |

**Animations by section** (all CSS, no JavaScript):

| Where | Animation |
|---|---|
| Header | Slides down on page open; a thin apricot **scroll progress bar** fills as you scroll |
| Hero | Text rises in; "I build Angular apps" **types itself** and the cursor blinks; two blurred apricot shapes drift behind; the photo floats inside a "breathing" ring and tilts on hover; the download arrow nudges down |
| Numbers | Outlined numbers **fill with navy** as you scroll to them |
| Section headings | The line after the title **draws itself** across |
| Expertise / Projects / Skills | Cards arrive one after another; hover lift; featured screenshot zooms slightly |
| Experience | The timeline line **draws downward**; the current job's dot pulses |
| Skills | Chips pop in and tilt on hover |
| Contact | The full stop in "Let's talk." wiggles on hover |

Scroll-linked effects use `animation-timeline: view()` / `scroll()` inside `@supports`, so browsers without support (e.g. Firefox today) simply show the final state. Everything moving is inside `prefers-reduced-motion: no-preference`, so visitors who ask their device for less motion get a still page.

## Performance notes

- `@defer (on viewport; prefetch on idle)`: the Projects code and its API calls don't block the first paint.
- OnPush everywhere and signals mean only the affected parts re-render.
- Animations use `transform`/`opacity` and scroll timelines (no scroll listeners).
- The headshot is about 60 KB; project images (when added) use `loading="lazy"`.
