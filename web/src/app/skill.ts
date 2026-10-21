/** One skill group with its skills, exactly as the API sends it (GET /api/skills) */
export interface SkillGroup {
  id: number;
  name: string;
  isCore: boolean;
  skills: { id: number; name: string }[];
}
