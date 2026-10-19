# Diagram — System Architecture

[← Docs home](../README.md) · Explained in [02 — System architecture](../02-system-architecture.md)

```mermaid
flowchart TB
    subgraph Browser["Visitor's browser"]
        NG["Angular app (web/)"]
    end
    subgraph API["Node.js API (api/) :3000"]
        APP["app.ts: cors → json → /api → notFound → errorHandler"]
        R["routes.ts → projects.routes.ts"]
        CTL["projects.controller.ts"]
        SVC["projects.service.ts"]
        PRC["db/prisma.ts (Prisma Client + pg adapter)"]
        ENV["config/env.ts ← .env"]
        APP --> R --> CTL --> SVC --> PRC
        ENV -.-> APP
        ENV -.-> PRC
    end
    subgraph PG["PostgreSQL :5432"]
        DB[("portfolio: projects, _prisma_migrations")]
    end
    NG -- "GET /api/projects…" --> APP
    PRC --> DB
```

The browser talks only to Express; only Prisma (inside services) talks to PostgreSQL. `.env` settings enter through `config/env.ts`.
