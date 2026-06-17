import api from "./api";

export interface SearchResult {
  users?: Array<{ id: number; name: string; email: string; job_title?: string; avatar_url?: string }>;
  projects?: Array<{ id: number; name: string; status: string; priority: string }>;
  tasks?: Array<{ id: number; title: string; status: string; priority: string; project_id: number }>;
}

export const searchService = {
  async global(query: string): Promise<SearchResult> {
    const { data } = await api.get("/search", { params: { q: query, limit: 5 } });
    return data;
  },
};
