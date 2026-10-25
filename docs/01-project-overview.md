# 01 — Project Overview

[← Docs home](README.md) · Next: [02 — System architecture](02-system-architecture.md)

## In plain English

This is a personal website that presents Devaangini Mehta as a Frontend Engineer: who she is, what she does well, the products she has helped build, where she has worked and what tools she uses. A recruiter or hiring manager opens the site, reads the headline and key numbers, looks through the projects and experience, can download the CV, and can send a message.

What makes it more than a static page is that **projects, experience and skills are not written into the page**. They are stored in a database and fetched when the page loads. The **contact form** goes the other way: it *saves* a visitor's message into the database. That is the "full-stack" part, and the reason the project exists: to learn how a real feature travels from a screen, through a server, to a database and back.

### An analogy (and where it stops working)

Think of a small office:

- The **web app** is the **reception desk**: it is what visitors see and talk to.
- The **API** is the **internal mail service**: reception sends it a written request ("the list of skills, please" or "please file this message"), it checks the request, does the work, and sends back an answer in a standard envelope (JSON).
- The **database** is the **records room**: neatly organised cabinets (tables) of index cards (rows).

Where the analogy breaks: reception does not keep copies of the records — every time a section appears, it asks again. And the "mail service" answers in milliseconds, not hours.

## Where it lives

- **Website:** `https://devaangini-portfolio.vercel.app` (Vercel)
- **API:** `https://portfolio-neon-six-56.vercel.app/api/…` (Vercel, one serverless function)
- **Database:** Neon PostgreSQL, connected through Vercel

Details: [09 — Deployment](09-deployment-and-configuration.md).

## Who it is for

- **Recruiters and hiring managers** — the visitors.
- **The owner** — a frontend developer learning backend and databases by building this.

## What visitors can do today

| Feature | Status | Where the content comes from |
|---|---|---|
| Read the hero ("Hi, my name is… I build Angular apps") with photo | ✅ | Written in the page; photo in `web/public/` |
| Download the CV (PDF) | ✅ | File in `web/public/` |
| See four headline numbers | ✅ | Static, in the component |
| Read "What I do" (four expertise cards) | ✅ | Static, in the component |
| Browse projects, filter by category chips | ✅ | **Database → API → page** |
| Read work experience (timeline) | ✅ | **Database → API → page** (recognition + education cards are static) |
| Read the technical toolkit (skill groups) | ✅ | **Database → API → page** |
| Send a message through the contact form | ✅ | **Page → API → database** (the first *write*) |
| Footer | ✅ | Static |

## Technologies and why they were chosen

| Layer | Technology | Why |
|---|---|---|
| Web app | **Angular 22** (TypeScript, Signals, `httpResource`, `@defer`, Reactive Forms) | The owner's expertise; modern Angular features were a stated goal |
| API | **Node.js 24 + Express 5 + TypeScript** | Same language as the frontend; Express shows the request → response flow plainly (NestJS was rejected because it hides that flow) |
| Database access | **Prisma 7** (ORM) | Type-safe queries, migrations and a seed script; raw SQL was learned first |
| Database | **PostgreSQL 18** locally, **Neon** (PostgreSQL in the cloud) live | Widely used relational database |
| Hosting | **Vercel** (Hobby) | Hosts both the Angular files and the Express API; connects Neon in a few clicks; deploys on every push |
| Design | Claude Design canvas, board **"J · Light & Calm"** | Light, warm and modern but still professional: off-white page, navy text, apricot accent, Nunito fonts, subtle CSS animations |

## How information travels (short version)

**Reading** (e.g. Skills):

1. The page loads; the Skills section asks the API: `GET http://localhost:3000/api/skills`.
2. The API asks Prisma for every skill group **together with** its skills.
3. Prisma turns that into SQL and asks PostgreSQL, using the link between the two tables.
4. The rows come back as nested JSON, and Angular draws the groups and chips.

**Writing** (the contact form):

1. The visitor fills in the form and clicks **Send message**.
2. Angular checks the fields, then sends `POST /api/contact` with the message in the body.
3. The API checks everything again, and Prisma saves a new row in `messages`.
4. The API answers **201 Created**, and the page shows "Thanks, your message was sent."

The full traces are in [06 — End-to-end data flow](06-end-to-end-data-flow.md).

## How the project is organised

```text
portfolio/                one git repository (private, on GitHub)
├── SESSION_CONTEXT.txt   working notes for continuing development
├── docs/                 this documentation
├── api/                  the server (Node + Express + Prisma)
└── web/                  the website (Angular)
```

Every source file starts with an **"ABOUT THIS FILE"** comment explaining what it is for.

## Technical overview (for developers)

- **Repository**: one git repo at `portfolio/` (branch `main`), private on GitHub because the CV contains a phone number. Commit from the root so both `api/` and `web/` changes are included.
- **API**: feature modules `src/modules/{projects,experience,skills,contact}/{routes,controller,service}`, central `config/env.ts`, 404 and 500 middleware, one shared `PrismaClient` using the `@prisma/adapter-pg` driver adapter. Production build to `dist/` via `tsconfig.build.json`.
- **Endpoints**: `GET /api/projects` (paging, `title`, `category`), `GET /api/projects/categories`, `GET /api/projects/:id`, `GET /api/experience`, `GET /api/skills`, `POST /api/contact`. Details: [04](04-api-documentation.md).
- **Database**: five tables managed by four Prisma migrations; the first one-to-many relationship (`skill_groups` → `skills`); a seed script for experience and skills. Details: [05](05-database-documentation.md).
- **Web**: standalone components, OnPush, signal inputs, `httpResource` for reading, `HttpClient.post` + Reactive Forms for the contact form, `linkedSignal` to keep the previous list during refetch, shared CSS helpers and CSS-only animations behind `prefers-reduced-motion`. Details: [03](03-frontend-documentation.md).
- **Deployment**: Vercel (two projects from one repo: `web` and `api`) + Neon Postgres; every push to `main` redeploys. See [09](09-deployment-and-configuration.md).
- **Not yet present**: authentication / admin area, email notifications, rate limiting.
