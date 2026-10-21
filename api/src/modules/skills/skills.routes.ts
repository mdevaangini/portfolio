import { Router } from "express";
import { listSkillGroups } from "./skills.controller.js";

/** URL map for the skills feature, mounted at "/api/skills". */
export const skillsRouter = Router();

skillsRouter.get("/", listSkillGroups); // GET /api/skills
