/** One job, exactly as the API sends it (GET /api/experience) */
export interface Experience {
  id: number;
  title: string;
  company: string;
  companyNote: string | null;
  location: string;
  summary: string;
  /** JSON has no date type, so dates arrive as text, e.g. "2024-05-01T00:00:00.000Z" */
  startDate: string;
  /** null = current job */
  endDate: string | null;
}
