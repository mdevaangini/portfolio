import type { Request, Response } from "express";
import { findExperiences } from "./experience.service.js";

/** GET /api/experience — no query values to read or check, so it's short. */
export async function listExperiences(_req: Request, res: Response) {
  const experiences = await findExperiences();
  res.json(experiences);
}
