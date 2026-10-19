# 01 — Project Overview

[← Docs home](README.md) · Next: [02 — System architecture](02-system-architecture.md)

## In plain English

This is a personal website that presents Devaangini Mehta as a Frontend Engineer: who she is, what she does well, and the products she has helped build. A recruiter or hiring manager opens the site, reads the headline and key numbers, looks through the projects, and can download the CV.

What makes it more than a static page is that the **project cards are not written into the page**. They are stored in a database and fetched when the page loads. That is the "full-stack" part, and the reason the project exists: to learn how a real feature travels from a screen, through a server, to a database and back.

### An analogy (and where it stops working)

Think of a small office:

- The **web app** is the **reception desk**: it is what visitors see and talk to.
- The **API** is the **internal mail service**: reception sends it a written request ("the list of projects, please"), it checks the request, fetches the answer, and sends it back in a standard envelope (JSON).
- The **database** is the **records room**: neatly organised cabinets (tables) of index cards (rows).

Where the analogy breaks: reception does not keep copies of the records — every time the projects section appears, it asks again. And the "mail service" answers in milliseconds, not hours.

## Who it is for

- **Recruiters and hiring managers** — the visitors.
- **The owner** — a frontend developer learning backend and databases by building this.

## What visitors can do today

| Feature | Status | Where the content comes from |
|---|---|---|
| Read the hero headline, intro and location | ✅ | Written in the page (static) |
| Download the CV (PDF) | ✅ | File in `web/public/` |
| See four headline numbers (impact strip) | ✅ | Static, in the component |
| Read "What I do" (four expertise cards) | ✅ | Static, in the component |
| Browse projects (featured card + grid) | ✅ | **Database → API → page** |
| Filter projects by category chips | ✅ | **Database → API → page** |
| Experience, Skills, Contact form, Footer | 📝 | Not built yet |

## Technologies and why they were chosen

| Layer | Technology | Why |
|---|---|---|
| Web app | **Angular 22** (TypeScript, Signals, `httpResource`, `@defer`) | The owner's expertise; modern Angular features were a stated goal |
| API | **Node.js 24 + Express 5 + TypeScript** | Same language as the frontend; Express shows the request → response flow plainly (NestJS was rejected because it hides that flow) |
| Database access | **Prisma 7** (ORM) | Type-safe queries and migrations; raw SQL was learned first, then replaced |
| Database | **PostgreSQL 18** | Widely used relational database |
| Design | Claude Design canvas, board "D · Navy Professional" | Professional, recruiter-friendly look |

## How information travels (short version)

1. The visitor scrolls to **Selected work**.
2. Angular asks the API: `GET http://localhost:3000/api/projects`.
3. The API checks the request and asks Prisma for the projects.
4. Prisma turns that into SQL and asks PostgreSQL.
5. The rows come back, become JSON, and Angular draws the cards.

The full trace is in [06 — End-to-end data flow](06-end-to-end-data-flow.md).

## How the project is organised

```text
portfolio/
├── SESSION_CONTEXT.txt   working notes for continuing development
├── docs/                 this documentation
├── api/                  the server (Node + Express + Prisma)
└── web/                  the website (Angular)
```

## Technical overview (for developers)

- **Monorepo-lite**: two independent npm projects side by side, no shared tooling. `web/` is a git repository (one initial commit; later work uncommitted). `api/` is **not** under git yet.
- **API**: feature-module structure (`src/modules/projects/{routes,controller,service}`), central `config/env.ts`, 404 and 500 middleware, a single shared `PrismaClient` using the `@prisma/adapter-pg` driver adapter.
- **Endpoints**: `GET /api/projects` (paging, `title`, `category`), `GET /api/projects/categories`, `GET /api/projects/:id`. All read-only. Details: [04](04-api-documentation.md).
- **Database**: one table, `projects`, managed by Prisma migrations (`0_init` baseline + `add_project_category`). Details: [05](05-database-documentation.md).
- **Web**: standalone components, OnPush, signal inputs, `httpResource` for GETs, `linkedSignal` to keep the previous list during refetch, CSS-only animations behind `prefers-reduced-motion`. Details: [03](03-frontend-documentation.md).
- **Not yet present**: authentication, write endpoints, automated tests (beyond an outdated default), deployment.
