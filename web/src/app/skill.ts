// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: skill.ts
// Interface: the shape of the JSON that GET /api/skills sends back.
// ──────────────────────────────────────────────────────────────────────

/** One skill group with its skills, exactly as the API sends it (GET /api/skills) */
export interface SkillGroup {
  id: number;
  name: string;
  isCore: boolean;
  skills: { id: number; name: string }[];
}
