# Diagram — Frontend Flow

[← Docs home](../README.md) · Explained in [03 — Frontend](../03-frontend-documentation.md)

```mermaid
flowchart TB
    M["main.ts: bootstrapApplication(App, appConfig)"] --> APP["App (app.html)"]
    APP --> H["Header (static, scroll progress bar)"]
    APP --> HE["Hero (static, photo, Download CV)"]
    APP --> IS["ImpactStrip (static)"]
    APP --> EX["Expertise (static)"]
    APP --> DF{"@defer on viewport"}
    DF --> P["Projects"]
    P --> PS["ProjectsService: GET /projects/categories,<br/>GET /projects?category=…"]
    CH["Chip click → selectedCategory.set()"] --> PS
    APP --> XP["Experience → ExperienceService: GET /experience"]
    APP --> SK["Skills → SkillsService: GET /skills"]
    APP --> CO["Contact (Reactive Form)"]
    CO -- "Send" --> CS["ContactService: POST /contact"]
    CS --> ST{"reply"}
    ST -- "201" --> OK["'Thanks, your message was sent'"]
    ST -- "400" --> FE["errors under each field"]
    ST -- "other" --> ER["'Something went wrong' box"]
    APP --> F["Footer (static)"]
```

Static sections render immediately. Experience and Skills fetch as soon as the page is created; Projects loads when scrolled near. The contact form sends data only when the visitor clicks **Send message**.
