# Diagram — API Request Flow

[← Docs home](../README.md) · Explained in [04 — API](../04-api-documentation.md)

```mermaid
flowchart TD
    REQ["Incoming request"] --> CORS["cors: allow CORS_ORIGIN"]
    CORS --> JSON["express.json()"]
    JSON --> API{"path starts with /api?"}
    API -- no --> NF["notFound → 404"]
    API -- yes --> PR{"/projects route match?"}
    PR -- "GET /" --> LP["listProjects"]
    PR -- "GET /categories" --> LC["listCategories"]
    PR -- "GET /:id" --> GP["getProject"]
    PR -- "no match" --> NF
    LP --> V1{"limit 1–50 and offset ≥ 0?"}
    V1 -- no --> E400["400 JSON"]
    V1 -- yes --> S1["findProjects → Prisma"]
    GP --> V2{"id positive integer?"}
    V2 -- no --> E400
    V2 -- yes --> S2["findProjectById → Prisma"]
    S2 --> F{"found?"}
    F -- no --> E404["404 JSON"]
    F -- yes --> OK["200 JSON"]
    S1 --> OK
    LC --> S3["findCategories → Prisma"] --> OK
    S1 & S2 & S3 -. "throws" .-> EH["errorHandler → 500 JSON + server log"]
```

Middleware runs first, then the route. Controllers return 400/404 for bad input or missing items. Anything that throws ends in the error handler.
