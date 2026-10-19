# Diagram — Database Relationships

[← Docs home](../README.md) · Explained in [05 — Database](../05-database-documentation.md)

## Current (implemented)

```mermaid
erDiagram
    projects {
        int id PK
        text title
        text summary
        text description
        text category "nullable"
        text image_url "nullable"
        text live_url "nullable"
        text repo_url "nullable"
        int display_order "default 0"
    }
```

One table, no relationships. `_prisma_migrations` (managed by Prisma) is omitted.

## 📝 Proposed next (not implemented)

```mermaid
erDiagram
    projects ||--o{ project_metrics : "has"
    projects {
        int id PK
        text title
        text role "nullable, planned"
    }
    project_metrics {
        int id PK
        int project_id FK
        text value
        text label
        int display_order
    }
```

One project has many metrics (e.g. "69M+ transactions"). `project_metrics.project_id` would point at `projects.id`, with deletes cascading.
