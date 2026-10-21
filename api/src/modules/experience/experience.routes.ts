import { Router } from "express";
import { listExperiences } from "./experience.controller.js";

/** URL map for the experience feature, mounted at "/api/experience". */
export const experienceRouter = Router();

experienceRouter.get("/", listExperiences); // GET /api/experience
