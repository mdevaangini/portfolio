# Diagram — Database Relationships

[← Docs home](../README.md) · Explained in [05 — Database](../05-database-documentation.md)

## Current (implemented)

```mermaid
erDiagram
    skill_groups ||--o{ skills : "has"
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
    experiences {
        int id PK
        text title
        text company
        text company_note "nullable"
        text location
        text summary
        date start_date
        date end_date "nullable = current job"
    }
    skill_groups {
        int id PK
        text name
        boolean is_core "default false"
        int display_order "default 0"
    }
    skills {
        int id PK
        text name
        int display_order "default 0"
        int group_id FK
    }
    messages {
        int id PK
        varchar name "max 100"
        varchar email "max 254"
        varchar message "max 2000"
        timestamp created_at "default now()"
    }
```

One relationship so far: **one skill group has many skills**. `skills.group_id` points at `skill_groups.id`; deleting a group deletes its skills (`ON DELETE CASCADE`). The other tables stand alone. `_prisma_migrations` (managed by Prisma) is omitted.

## 📝 Possible next (postponed)

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

One project would have many metrics (e.g. "69M+ transactions"), using the same pattern as skill groups and skills.
