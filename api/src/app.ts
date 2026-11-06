// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.ts
// Builds the Express app: the steps EVERY request passes through, in order:
// CORS → turn JSON body into req.body → read cookies into req.cookies → /api routes
// → 404 → error handler.
// ──────────────────────────────────────────────────────────────────────

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { apiRouter } from "./routes.js";

/**
 * Builds the Express app. It does NOT start the server, so it can also be used in tests.
 *
 * Order matters: Express runs these top to bottom for every request.
 */
export const app = express();

// 1. Before routes: prepare the request
app.use(cors({ origin: env.corsOrigin })); // allow the Angular app to read responses
app.use(express.json({ limit: "300kb" })); // turn a JSON request body into req.body.
// (300kb instead of the default 100kb: a long blog post in Markdown must fit.)
app.use(cookieParser()); // turn the Cookie header into req.cookies (the login "key card")

// 2. The routes: every feature lives under /api
app.use("/api", apiRouter); // -> hands the request to routes.ts, then to the feature’s routes, then to its controller. ✅

// 3. After routes: only reached when nothing above sent a response
app.use(notFound); // no route matched → 404
app.use(errorHandler); // something threw → 500
//One precision on the two lines after it (notFound, errorHandler): they aren’t run after every route. They’re only reached as a fallback: when no route answered (404) or something crashed (500).

/**
 * What the file exports: exactly as you said, the app instance built with Express, and it’s exported twice:
export const app, used by server.ts (laptop) and the tests;
export default app, used by Vercel.
The file itself never starts listening; that’s server.ts’s job. ✅
 */

// Vercel looks for a file like src/app.ts with a *default* export and turns this
// app into one serverless function. Locally, server.ts imports the named `app` above.
export default app;

/**
 * Angular comparison: you could build a website with plain DOM code (document.createElement, addEventListener everywhere). Angular gives you components, routing and services so you don’t have to. Express does the same for Node’s raw server: routing, middleware and helpers.

        Where Express lives in our project:

        app.ts: express() creates the app, app.use(...) builds the pipeline
        *.routes.ts: Router() maps URLs to functions
        *.controller.ts: works with req and res
        middleware/: requireAdmin, checkOrigin, 404, 500

        Services and Prisma don’t use Express at all. That’s the controller/service split again: Express stops at the controller.

        So Express is to the server what Angular is to the browser: the framework that gives raw requests a structure.
 */

/**
 * First part: yes. const app = express() creates an instance, and through it we use Express’s methods: app.use(...), app.listen(...), and so on. (In the routes files, Router() makes small instances of the same kind.)

Second part: one important correction. The API doesn’t attach anything to the request headers. The browser attached them. The API only reads them.

What those two lines do is read raw text and turn it into ready-to-use objects, which they put on req:

This is what really arrives at the API (raw text):

POST /api/auth/login
Content-Type: application/json          ← header: "the body is JSON"
Cookie: session=abc123; theme=light     ← header: the cookie the browser attached

{"email":"me@x.com","password":"secret"}   ← body: the payload, still just text



After the two lines in app.ts:

Line                        	Reads	                                                                                Turns it into
express.json()	                the body (the payload). It checks the Content-Type header to know it’s JSON	           req.body = { email: "me@x.com", password: "secret" }


cookieParser()	                the Cookie header	                                                                   req.cookies = { session: "abc123", theme: "light" }

Why: controllers can then just write req.body.email or req.cookies.session, instead of each controller parsing text by itself. It’s done once, at the start of the pipeline, for every request.

Note that the body isn’t a header. Headers are the labels on the envelope, and the body is the letter inside. express.json() opens the letter, and cookieParser() reads one label.

So: the browser attaches the headers, and express.json() and cookieParser() read the body and the cookie and hand them to the controllers as req.body and req.cookies.
 */
