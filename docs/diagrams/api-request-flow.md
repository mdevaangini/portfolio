# Diagram — API Request Flow

[← Docs home](../README.md) · Explained in [04 — API](../04-api-documentation.md)

```mermaid
flowchart TD
    REQ["Incoming request"] --> CORS["cors: allow CORS_ORIGIN"]
    CORS --> JSON["express.json(): body → req.body"]
    JSON --> API{"path starts with /api?"}
    API -- no --> NF["notFound → 404"]
    API -- yes --> FEAT{"which feature?"}
    FEAT -- "/projects" --> PR{"route"}
    FEAT -- "GET /experience" --> EXP["listExperiences → findExperiences"]
    FEAT -- "GET /skills" --> SK["listSkillGroups → findSkillGroups"]
    FEAT -- "POST /contact" --> CT["sendMessage"]
    FEAT -- "no match" --> NF
    PR -- "GET /" --> LP["listProjects"]
    PR -- "GET /categories" --> LC["listCategories → findCategories"]
    PR -- "GET /:id" --> GP["getProject"]
    LP --> V1{"limit 1–50 and offset ≥ 0?"}
    V1 -- no --> E400["400 JSON"]
    V1 -- yes --> S1["findProjects"]
    GP --> V2{"id positive integer?"}
    V2 -- no --> E400
    V2 -- yes --> S2["findProjectById"]
    S2 --> F{"found?"}
    F -- no --> E404["404 JSON"]
    F -- yes --> OK["200 JSON"]
    CT --> TRAP{"spam field 'website' filled?"}
    TRAP -- yes --> FAKE["201, nothing saved"]
    TRAP -- no --> V3{"name, email, message valid?"}
    V3 -- no --> E400F["400 { error, fields }"]
    V3 -- yes --> SAVE["createMessage → INSERT"] --> C201["201 { ok, id, createdAt }"]
    S1 & LC & EXP & SK --> OK
    S1 & S2 & LC & EXP & SK & SAVE -. "throws" .-> EH["errorHandler → 500 JSON + server log"]
```

Middleware runs first, then the route. Controllers return 400/404 for bad input or missing items, and 201 when something new was saved. Anything that throws ends in the error handler.
