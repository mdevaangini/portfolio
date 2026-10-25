# 11 — Glossary for Beginners

[← 10 Security](10-security-and-maintenance.md) · [Docs home](README.md)

Each term has a plain definition, an everyday comparison where it helps, and where it appears in this project.

| Term | Plain definition | Everyday comparison | In this project |
|---|---|---|---|
| **Frontend** | The part of an app that runs in the visitor's browser and that they see | The shop floor | `web/`, built with Angular |
| **Backend** | The part that runs on a server, out of sight | The stock room and office | `api/`, Node + Express |
| **API** | A set of addresses the frontend can call to get or send data | A service counter with set request forms | `/api/projects`, `/api/experience`, `/api/skills`, `/api/contact` |
| **HTTP request / response** | A message from the browser asking for something, and the reply | A letter and its answer | `GET /api/projects` → JSON reply |
| **HTTP method** | The kind of request: `GET` reads, `POST` sends something new, etc. | "Show me" vs "Here's something new" | `GET` for sections; `POST /api/contact` for the form |
| **Request body** | Data sent *inside* a request (not in the URL) | The letter inside the envelope | The contact form's JSON → `req.body` |
| **Endpoint** | One API address plus one method | One window at the counter | `GET /api/projects/:id` |
| **Query parameter** | Extra options after `?` in a URL | Ticking boxes on the request form | `?limit=2&category=Payments` |
| **Route parameter** | A value inside the path | A room number in an address | the `3` in `/api/projects/3` |
| **Status code** | A number saying how the request went | A stamp: "done", "wrong form", "not found" | 200 OK, **201 Created**, 400, 404, 500 |
| **JSON** | A text format for structured data | A neatly filled-in form | `{ "data": [...], "total": 3 }` |
| **Component** | A self-contained piece of UI (template + logic + styles) | A Lego brick | `Projects`, `Hero`, `Header` |
| **Service (Angular)** | A class that holds shared logic, often API calls | A shared assistant | `ProjectsService`, `SkillsService`, `ContactService` |
| **Reactive Form** | Angular's way of describing a form and its rules in TypeScript | A form template with rules printed on it | The contact form |
| **Service (API)** | Our name for the file that talks to the database | The archivist | `projects.service.ts` |
| **Controller** | Our name for the file that reads the request, checks it and sends the reply | The clerk at the counter | `projects.controller.ts` |
| **Routing** | Choosing which code handles which address | A receptionist directing visitors | `routes.ts`, `projects.routes.ts` (API); Angular router is set up but unused |
| **Signal** | An Angular value that tells the UI when it changes | A light that turns on when news arrives | `selectedCategory` |
| **httpResource** | Angular helper that fetches data and exposes it as signals | A subscription that refreshes itself | `loadProjects`, `loadCategories` |
| **State** | Data the UI remembers right now | What's currently on the whiteboard | the selected chip |
| **Server** | A program that waits for requests and answers them | A shop that's open | the Express app on port 3000 |
| **Port** | A numbered door on a computer that a program listens on | Flat numbers in a building | 4200 (web), 3000 (API), 5432 (DB) |
| **Database** | Organised, permanent storage for data | A filing room | PostgreSQL database `portfolio` |
| **Table / row / column** | A sheet; one record; one kind of field | Spreadsheet sheet / line / header | table `projects`; one row per project; `title`, `category`… |
| **Primary key** | The column that uniquely identifies each row | A national ID number | `projects.id` |
| **Foreign key** | A column pointing at a row in another table | "See file #3" | `skills.group_id` → `skill_groups.id` |
| **One-to-many relationship** | One row in table A can be linked to many rows in table B | One folder holding many sheets | One skill group has many skills |
| **Cascade delete** | Deleting a parent row also deletes its linked child rows | Throwing away a folder throws away its sheets | Deleting a skill group deletes its skills |
| **SQL / query** | The language for asking a database things; one such question | Questions to the archivist | `SELECT * FROM projects …` |
| **ORM** | A library that writes SQL for you from code | A translator | Prisma |
| **Prisma Client** | The generated code your app calls to query the DB | The translator on duty | `prisma.project.findMany()` |
| **Prisma commands** | Terminal commands for developers (not part of the running app) | Tools in a workshop | `npx prisma migrate dev`, `generate`, `studio` |
| **Schema (Prisma)** | A file describing the tables | The filing room's floor plan | `api/prisma/schema.prisma` |
| **Migration** | A saved file describing one structure change | A Git commit for tables | `0_init` … `add_messages` (4 so far) |
| **Seed / seed script** | Code that puts starting data into the database | Stocking the shelves before opening | `api/prisma/seed.ts`, `npm run seed` |
| **Nested create** | Saving a row and its linked rows in one Prisma call | Filing a folder with its sheets already inside | Each skill group + its skills in the seed |
| **Baseline** | The first migration for a database that already existed | First commit on an existing project | `0_init` |
| **Middleware** | Code that runs on every request before or after the routes | Security check at the entrance | `cors`, `express.json`, `notFound`, `errorHandler` |
| **Validation** | Checking input is acceptable before using it | Checking a form is filled in correctly | `limit` must be 1–50; contact fields required, email format, max lengths |
| **Spam trap (honeypot)** | A hidden form field only bots fill in | A fake door only burglars try | The `website` field in the contact form |
| **Authentication / authorization** | Who are you? / What may you do? | ID check / access badge | not implemented (site is public, read-only) |
| **Environment variable** | A setting kept outside the code | A sticky note on the machine | `DATABASE_URL`, `PORT`, `CORS_ORIGIN` |
| **`.env` file** | A file holding environment variables locally (secret) | A locked drawer | `api/.env` |
| **CORS** | Browser rule: a page may only read responses from another site if that site allows it | A guest list at the door | API allows `http://localhost:4200` |
| **Build** | Turning source code into files ready to serve | Printing the final book | `npm run build` in web (→ `web/dist/`) and in api (→ `api/dist/`) |
| **Deployment** | Putting the app on servers so others can use it | Opening the shop to the public | ✅ Vercel + Neon (2026-10-25) |
| **Vercel** | A hosting service that builds and serves websites and small backends from a Git repo | A landlord who also builds the shop from your plans | Two projects: `devaangini` (web), `portfolio` (API) |
| **Serverless function** | Backend code that the host starts on demand when a request arrives, instead of a server running all day | A taxi called when needed instead of a car parked outside | The whole Express app on Vercel |
| **Neon** | A company that runs PostgreSQL in the cloud | The records room moved to a secure warehouse | `portfolio-db` |
| **Pooled / unpooled connection** | Pooled: many visitors share a few database connections (for the app). Unpooled: one direct line (for migrations) | A shared taxi rank vs a private car | `DATABASE_URL` / `DATABASE_URL_UNPOOLED` |
| **Environment file (Angular)** | A file of settings swapped depending on how the app is built | Different address labels for test and real parcels | `environment.ts` / `environment.development.ts` |
| **ISO date text** | The standard way dates travel in JSON, e.g. `2024-05-01T00:00:00.000Z` | A date written in a fixed international format | `startDate`, `createdAt`; formatted by Angular's `date` pipe |
| **Scroll-driven animation** | A CSS animation whose progress follows scrolling instead of time | A blind that opens as you walk past | Progress bar, numbers filling, lines drawing |
| **Error handling** | Deciding what happens when something goes wrong | A plan for complaints | 400/404 in controllers, 500 in `error-handler.ts` |
| **`@defer`** | Angular feature to load part of a page only when needed | Fetching a chair only when a guest arrives | Projects section loads on viewport |
| **Pagination** | Returning results in pages | Pages of a catalogue | `limit` and `offset` |
