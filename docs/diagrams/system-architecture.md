# Diagram — System Architecture

[← Docs home](../README.md) · Explained in [02 — System architecture](../02-system-architecture.md)

```mermaid
flowchart TB
    subgraph Browser["Visitor's browser"]
        NG["Angular app (web/)"]
    end
    subgraph API["Node.js API (api/) :3000"]
        APP["app.ts: cors → json → /api → notFound → errorHandler"]
        R["routes.ts: /projects · /experience · /skills · /contact"]
        CTL["*.controller.ts (validate, status codes)"]
        SVC["*.service.ts (Prisma calls)"]
        PRC["db/prisma.ts (Prisma Client + pg adapter)"]
        ENV["config/env.ts ← .env"]
        APP --> R --> CTL --> SVC --> PRC
        ENV -.-> APP
        ENV -.-> PRC
    end
    subgraph PG["PostgreSQL :5432"]
        DB[("portfolio: projects, experiences, skill_groups,<br/>skills, messages, _prisma_migrations")]
    end
    SEED["prisma/seed.ts<br/>(npm run seed)"] -.-> DB
    NG -- "GET sections · POST /api/contact" --> APP
    PRC --> DB
```

The browser talks only to Express; only Prisma (inside services) talks to PostgreSQL. `.env` settings enter through `config/env.ts`. The seed script is run by hand, not by the website.
