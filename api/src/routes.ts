// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: routes.ts
// The main API router: connects each feature to its URL
// (/projects, /experience, /skills, /contact, /auth). New feature = one new line here.
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { contactRouter } from "./modules/contact/contact.routes.js";
import { experienceRouter } from "./modules/experience/experience.routes.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";
import { skillsRouter } from "./modules/skills/skills.routes.js";

/**
 * The main API router: one line per feature.
 * Adding a feature = adding its router here.
 */
export const apiRouter = Router();

apiRouter.use("/projects", projectsRouter);
apiRouter.use("/experience", experienceRouter);
apiRouter.use("/skills", skillsRouter);
apiRouter.use("/contact", contactRouter);
apiRouter.use("/auth", authRouter); // Blog: login (milestone 3)
