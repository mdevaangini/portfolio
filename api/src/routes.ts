// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: routes.ts
// The main API router: connects each feature to its URL
// (/projects, /experience, /skills, /contact, /posts, /tags, /auth, /admin).
// New feature = one new line here.
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { checkOrigin } from "./middleware/check-origin.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { contactRouter } from "./modules/contact/contact.routes.js";
import { postsRouter } from "./modules/posts/posts.routes.js";
import { tagsRouter } from "./modules/tags/tags.routes.js";
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
apiRouter.use("/posts", postsRouter); // Blog: public, published posts only (milestone 5)
apiRouter.use("/tags", tagsRouter); //   Blog: public tag list (milestone 5)
// Blog (milestone 3). checkOrigin first: changes must come from my website.
apiRouter.use("/auth", checkOrigin, authRouter); // login, me, logout
apiRouter.use("/admin", checkOrigin, adminRouter); // guarded by requireAdmin inside
