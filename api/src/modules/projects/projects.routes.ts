import { Router } from "express";
import { getProject, listCategories, listProjects } from "./projects.controller.js";

/**
 * URL map for the projects feature. Paths here are relative to where
 * this router is mounted ("/api/projects"), so "/" means "/api/projects".
 *
 * ORDER MATTERS: Express checks these top to bottom and uses the first match.
 * "/categories" must come before "/:id", otherwise "/:id" would catch it
 * and treat the word "categories" as an id.
 */
export const projectsRouter = Router();

projectsRouter.get("/", listProjects); //              GET /api/projects
projectsRouter.get("/categories", listCategories); //  GET /api/projects/categories
projectsRouter.get("/:id", getProject); //             GET /api/projects/3  (":id" = "whatever is here")
