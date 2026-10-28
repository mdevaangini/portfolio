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

Portfolio: **one skill group has many skills**. `skills.group_id` points at `skill_groups.id`; deleting a group deletes its skills (`ON DELETE CASCADE`). The other portfolio tables stand alone. `_prisma_migrations` (managed by Prisma) is omitted.

## Blog tables (Blog milestone 2, implemented)

```mermaid
erDiagram
    users ||--o{ sessions : "logs in with"
    users ||--o{ posts : "writes"
    posts ||--o{ post_tags : "has"
    tags ||--o{ post_tags : "labels"
    users {
        int id PK
        varchar email UK "max 254"
        text password_hash "scrypt fingerprint"
        enum role "ADMIN"
        int failed_logins "default 0"
        timestamp locked_until "nullable"
    }
    sessions {
        int id PK
        text token_hash UK
        int user_id FK
        timestamp expires_at
    }
    posts {
        int id PK
        varchar title "max 150"
        varchar slug UK "max 80"
        varchar excerpt "max 300"
        text content "Markdown"
        varchar cover_image_url "nullable"
        enum status "DRAFT or PUBLISHED"
        timestamp published_at "nullable"
        int author_id FK
    }
    tags {
        int id PK
        varchar name UK "max 30"
        varchar slug UK "max 40"
    }
    post_tags {
        int post_id PK,FK
        int tag_id PK,FK
    }
```

- One user (me) has many **sessions** (logged-in browsers) and writes many **posts**.
- **Many-to-many:** posts ↔ tags, through the join table `post_tags` (one row per pair; the pair is the key).
- Deleting a user deletes their sessions; deleting a post or tag deletes its `post_tags` rows (cascade).

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
