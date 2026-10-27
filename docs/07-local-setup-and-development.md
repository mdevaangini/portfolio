# 07 — Local Setup and Development

[← 06 End-to-end flow](06-end-to-end-data-flow.md) · [Docs home](README.md) · Next: [08 — Testing and debugging](08-testing-and-debugging.md)

How to run the whole project on a new machine. All commands come from the project's real `package.json` files. Paths assume the project lives in a folder called `portfolio/`.

## 1. Prerequisites

| Software | Version used | Notes |
|---|---|---|
| Node.js | **24.x** (24.21.0 in use) | Angular 22 requires `^22.22.3 \|\| ^24.15.0 \|\| ^26`. On Windows, `nvm-windows` lets you switch versions per project |
| npm | bundled with Node | `web` declares `packageManager: npm@11.19.0` |
| PostgreSQL | **18** | Default port 5432. pgAdmin 4 is optional but handy |
| Git | any | One repository at `portfolio/` (private on GitHub). Always commit from the `portfolio/` root |
| Editor | VS Code (recommended) | On Windows, use the **Git Bash** terminal for the Prisma commands below |

## 2. Database

1. Install PostgreSQL and remember the password you set for the `postgres` user.
2. Create an empty database called `portfolio` (pgAdmin: right-click *Databases* → *Create* → *Database*).

## 3. API (`api/`)

```bash
cd api
npm install
cp .env.example .env        # then edit .env and put in your real password
```

`.env` needs one required line:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/portfolio
```

Optional lines (defaults shown): `PORT=3000`, `CORS_ORIGIN=http://localhost:4200`.

### Create the tables

- **New, empty database:**

  ```bash
  npx prisma migrate deploy   # applies every migration in prisma/migrations, in order
  npx prisma generate         # creates the TypeScript client in generated/prisma
  ```

- **Existing database that already has the tables** (e.g. the original developer machine): only `npx prisma generate` is needed.

### Add some data

```bash
npm run seed    # fills projects, experiences, skill_groups and skills with the CV data
```

Expected: `Seeded: 3 projects, 3 jobs, 6 skill groups, 26 skills`. Safe to run again.

You can also edit rows any time with `npx prisma studio` (a spreadsheet-like editor in the browser) or with SQL in pgAdmin.

### Run it

```bash
npm run dev     # tsx watch --env-file=.env src/server.ts
```

Expected: `API running at http://localhost:3000`. It restarts automatically when you save a file.

To try the production build instead: `npm run build` then `npm run start:local` (see [09](09-deployment-and-configuration.md)).

## 4. Web (`web/`)

```bash
cd web
npm install
npm start       # ng serve → http://localhost:4200
```

The web app calls **`/api/...` on its own address** (`localhost:4200/api/...`). The dev server passes those requests on to the API at `localhost:3000` (set in `web/proxy.conf.json`, linked in `angular.json` → `serve`). So the API must be running too. After changing `proxy.conf.json` or `angular.json`, restart `npm start`.

In DevTools → Network you'll see `localhost:4200/api/skills`, not `:3000`. That's expected.

## 5. Check each layer

| Layer | Check | Expected |
|---|---|---|
| Database | pgAdmin: `SELECT * FROM projects;` | Your rows |
| Prisma | `npx prisma validate` (in `api/`) | "schema … is valid" |
| API | Open `http://localhost:3000/api/projects` | JSON `{ data, total, limit, offset }` |
| API | `http://localhost:3000/api/projects/categories` | e.g. `["Banking","Lending","Payments"]` |
| API | `http://localhost:3000/api/experience` | 3 jobs, newest first |
| API | `http://localhost:3000/api/skills` | 6 groups, each with `skills: [...]` |
| API | Postman: **POST** `http://localhost:3000/api/contact`, Body → raw → JSON | 201 `{ ok, id, createdAt }` |
| API | `http://localhost:3000/api/hello` | 404 JSON |
| Web | Open `http://localhost:4200` and scroll through | Projects with chips, experience timeline, skill groups, contact form |

## 6. Everyday development commands

| Task | Command (folder) |
|---|---|
| Start API | `npm run dev` (api) |
| Start web | `npm start` (web) |
| Build web for production | `npm run build` (web) → `web/dist/` |
| Run web tests | `npm test` (web) — 3 tests; see [08](08-testing-and-debugging.md) |
| Run API tests | `npm test` (api) — 5 tests, no database needed; `npm run test:watch` re-runs on save |
| Refill experience + skills | `npm run seed` (api) |
| Build / run the API like production | `npm run build`, `npm run start:local` (api) |
| Change table structure | edit `prisma/schema.prisma` → `npx prisma migrate dev --name <change>` → `npx prisma generate` (api) |
| Browse/edit data | `npx prisma studio` (api) |

## 7. Publishing changes to the live site

Commit and push from the `portfolio/` root; Vercel rebuilds the website and the API by itself. Details, including how to update the live database: [09 — Deployment](09-deployment-and-configuration.md#everyday-operations).

## 8. Common problems

| Symptom | Likely cause | Fix |
|---|---|---|
| `Missing required environment variable: DATABASE_URL` | No `.env`, or the variable is misspelled | Create `api/.env` from `.env.example` |
| `node -v` shows an old version after installing nvm | An older standalone Node is earlier in PATH | Uninstall it (Windows: *Settings → Apps*); open a new terminal; restart VS Code |
| VS Code terminal says `node: not found` | VS Code was open while Node changed | Close all VS Code windows and reopen |
| `Property 'project' does not exist on PrismaClient` | Client generated before the schema changed | `npx prisma generate`, then *TypeScript: Restart TS Server* |
| New column missing in code after `migrate dev` | Prisma 7 doesn't auto-generate | `npx prisma generate` |
| Error in `schema.prisma` about `/**` | Block comments aren't allowed there | Use `//` or `///` |
| `migrate diff … > file.sql` produces a broken file | PowerShell writes UTF-16 | Run it in Git Bash |
| Page says "Projects couldn't be loaded." | API not running, CORS, or DB down | See [08 — debugging walkthrough](08-testing-and-debugging.md#debugging-walkthrough-projects-dont-appear) |
| Postman: 404 "Route not found: GET /api/contact" | The method is still GET | Switch the method dropdown to **POST** |
| New table not visible in pgAdmin | pgAdmin shows an old list | Right-click **Tables → Refresh** |
| `git` commit misses api (or web) files | `git add .` was run inside a sub-folder | Run git commands from the `portfolio/` root |
| Old favicon still shows | Browsers cache favicons | **Ctrl + Shift + R**, or a private window |
| Browser Network tab: "CORS error" | API not running or old process, or `CORS_ORIGIN` mismatch | Restart the API; check only one process uses port 3000 (`netstat -ano \| findstr :3000` on Windows) |
