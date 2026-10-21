import type { Request, Response } from "express";
import { findSkillGroups } from "./skills.service.js";

/** GET /api/skills */
export async function listSkillGroups(_req: Request, res: Response) {
  const groups = await findSkillGroups();
  res.json(groups);
}
