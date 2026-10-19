# 07 — Local Setup and Development

[← 06 End-to-end flow](06-end-to-end-data-flow.md) · [Docs home](README.md) · Next: [08 — Testing and debugging](08-testing-and-debugging.md)

How to run the whole project on a new machine. All commands come from the project's real `package.json` files. Paths assume the project lives in a folder called `portfolio/`.

## 1. Prerequisites

| Software | Version used | Notes |
|---|---|---|
| Node.js | **24.x** (24.21.0 in use) | Angular 22 requires `^22.22.3 \|\| ^24.15.0 \|\| ^26`. On Windows, `nvm-windows` lets you switch versions per project |
| npm | bundled with Node | `web` declares `packageManager: npm@11.19.0` |
| PostgreSQL | **18** | Default port 5432. pgAdmin 4 is optional but handy |
| Git | any | `web/` is a git repo; `api/` is not yet |
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

📝 There is **no seed script yet**, so a new database starts with no projects. Add rows with `npx prisma studio` (opens a spreadsheet-like editor in the browser) or with SQL in pgAdmin, for example:

```sql
INSERT INTO projects (title, summary, description, category, display_order)
VALUES ('Example project', 'One-line summary.', 'Longer description.', 'Payments', 1);
```

### Run it

```bash
npm run dev     # tsx watch --env-file=.env src/server.ts
```

Expected: `API running at http://localhost:3000`. It restarts automatically when you save a file.

## 4. Web (`web/`)

```bash
cd web
npm install
npm start       # ng serve → http://localhost:4200
```

The web app expects the API at `http://localhost:3000/api` (set in `web/src/app/core/api.config.ts`).

## 5. Check each layer

| Layer | Check | Expected |
|---|---|---|
| Database | pgAdmin: `SELECT * FROM projects;` | Your rows |
| Prisma | `npx prisma validate` (in `api/`) | "schema … is valid" |
| API | Open `http://localhost:3000/api/projects` | JSON `{ data, total, limit, offset }` |
| API | `http://localhost:3000/api/projects/categories` | e.g. `["Banking","Lending","Payments"]` |
| API | `http://localhost:3000/api/hello` | 404 JSON |
| Web | Open `http://localhost:4200`, scroll to *Selected work* | Cards and category chips |

## 6. Everyday development commands

| Task | Command (folder) |
|---|---|
| Start API | `npm run dev` (api) |
| Start web | `npm start` (web) |
| Build web for production | `npm run build` (web) → `web/dist/` |
| Run web tests | `npm test` (web), currently out of date; see [08](08-testing-and-debugging.md) |
| Change table structure | edit `prisma/schema.prisma` → `npx prisma migrate dev --name <change>` → `npx prisma generate` (api) |
| Browse/edit data | `npx prisma studio` (api) |

## 7. Common problems

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
| Browser Network tab: "CORS error" | API not running or old process, or `CORS_ORIGIN` mismatch | Restart the API; check only one process uses port 3000 (`netstat -ano \| findstr :3000` on Windows) |
