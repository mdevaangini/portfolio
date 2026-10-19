/** One project, exactly as the API sends it (GET /api/projects) */
export interface Project {
  id: number;
  title: string;
  summary: string;
  description: string;
  category: string | null;
  imageUrl: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  displayOrder: number;
}

/** The list response: one page of projects plus paging info */
export interface ProjectsResponse {
  data: Project[];
  total: number;
  limit: number;
  offset: number;
}
