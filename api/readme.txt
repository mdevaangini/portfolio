- The flow so far (after Step 2) -> before Prisma

       When the server starts (once):

       npm run dev loads .env.
       config/env.ts reads and checks the settings.
       db/pool.ts opens connections to PostgreSQL.
       app.ts lines up the middleware and routes.
       server.ts starts listening on port 3000.

       On every HTTP call from Angular:

       Angular (httpResource) sends GET localhost:3000/api/projects.
       app.ts → cors checks the caller is allowed (localhost:4200).
       app.ts → express.json unpacks a request body, if there is one.
       app.ts → /api hands over to routes.ts.
       routes.ts → /projects hands over to the projects module.
       projects.routes.ts → GET / calls the controller.
       projects.controller.ts asks the service for the projects.
       projects.service.ts runs the SQL through the pool.
       db/pool.ts → PostgreSQL finds the rows and returns them.
       Back up the chain: service → controller → res.json(...) sends the JSON.
       Angular receives it, and value() updates the page.

       If something goes wrong:

       No route matches → not-found.ts returns a 404.
       Anything throws in steps 7–9 → error-handler.ts logs the error and returns a 500.







       After prisma

       Going out (Angular → database)

       Angular: project.service / httpResource sends GET localhost:3000/api/projects.
       app.ts: cors checks the request comes from the allowed site (localhost:4200).
       app.ts: express.json unpacks a request body, if there is one.
       app.ts: /api hands the request to the main router.
       routes.ts: /projects hands it to the projects feature.
       projects.routes.ts: GET / picks the controller function, listProjects.
       projects.controller.ts asks the service for the projects.
       projects.service.ts calls prisma.project.findMany().
       db/prisma.ts: Prisma writes the SQL and sends it to PostgreSQL.
       PostgreSQL finds the rows in the projects table.

       Coming back (database → Angular)

       db/prisma.ts: Prisma turns the rows into Project objects with camelCase names.
       projects.service.ts returns them to the controller.
       projects.controller.ts sends them as JSON with res.json().
       Angular: httpResource receives the JSON, and the page updates.

       If something goes wrong

       not-found.ts: no route matched → 404.
       error-handler.ts: anything failed in steps 7–11 → logs it and sends a 500.

       Set up once, when the server starts: .env → config/env.ts → db/prisma.ts → app.ts → server.ts.

NOTE: in modules -> It’s the same split as before: the controller deals with the request, the service deals with the database.





=======================================


Prisma does only one job: it talks to the database. Everything else is your own Express code.

Who	                                                                               What it handles

Express (app.ts, routes.ts, projects.routes.ts)	                                   Receives the request from Angular and sends it to the right function
Your controller	                                                                   Reads limit, offset and title, checks them, and sends the 400 for ?limit=abc
Your service	                                                                   Decides what to ask the database for
Prisma	                                                                           Turns that into SQL, gets the rows from PostgreSQL, hands them back
Your controller	                                                                   Sends the JSON back to Angular
Your error-handler.ts	                                                           Sends a 500 if anything crashes

So in your test table, the 400 for ?limit=abc comes from your controller, and Prisma is never even called. For the other URLs, Prisma does the database part in the middle.

Think of Prisma as HttpClient in Angular: it does the fetching, but your components and services decide what to fetch and what to show.


===========================================


“Controller” and “service” aren’t Express features. They’re just a way of organising your code that developers agree on, like components and services in Angular. Express doesn’t know or care that those files are called controller and service.

That’s also why the service has no Express in it: it could be reused anywhere, even outside a web server, because it only knows about data.

File	                                                                                    Is it Express?
app.ts, routes.ts, projects.routes.ts	                                                 Yes: they use Express to receive requests and route them
projects.controller.ts	                                                               Uses Express: it receives Express’s req and res to read the request and send the answer
projects.service.ts	                                                                      No: plain TypeScript functions. No req, no res. It only talks to Prisma