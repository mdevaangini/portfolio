# Diagram — Frontend Flow

[← Docs home](../README.md) · Explained in [03 — Frontend](../03-frontend-documentation.md)

```mermaid
flowchart TB
    M["main.ts: bootstrapApplication(App, appConfig)"] --> APP["App (app.html)"]
    APP --> H["Header (static)"]
    APP --> HE["Hero (static, Download CV)"]
    APP --> IS["ImpactStrip (static)"]
    APP --> EX["Expertise (static) → SectionHeading"]
    APP --> DF{"@defer on viewport"}
    DF --> P["Projects → SectionHeading"]
    P --> SVC["ProjectsService"]
    SVC --> RC["loadCategories(): GET /api/projects/categories"]
    SVC --> RP["loadProjects(selectedCategory): GET /api/projects?category=…"]
    CH["Chip click → selectedCategory.set()"] --> RP
    RP --> L["linkedSignal list → featured / others"]
    L --> UI["Cards (dimmed while refetching)"]
```

Static sections render immediately. The Projects section loads when scrolled near, then fetches categories and projects. A chip click changes a signal, which re-runs the projects request automatically.
