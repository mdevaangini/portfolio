import { Router } from "express";
import { projectsRouter } from "./modules/projects/projects.routes.js";

/**
 * The main API router: one line per feature.
 * Adding a feature = adding its router here.
 */
export const apiRouter = Router();

apiRouter.use("/projects", projectsRouter);
