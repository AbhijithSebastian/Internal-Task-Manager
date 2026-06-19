import api from "./api";

export interface SearchResult {
  users?: Array<{ id: number; name: string; email: string; job_title?: string; avatar_url?: string }>;
  projects?: Array<{ id: number; name: string; status: string; priority: string }>;
  tasks?: Array<{ id: number; title: string; status: string; priority: string; project_id: number }>;
}

export interface GlobalSearchResult {
  id: number;
  type: "user" | "project" | "task";
  title: string;
  subtitle?: string;
  url?: string;
}

export const searchService = {
  async global(query: string): Promise<SearchResult> {
    const { data } = await api.get("/search", { params: { q: query, limit: 5 } });
    return data;
  },
};

export async function globalSearch(query: string, limit = 10): Promise<GlobalSearchResult[]> {
  const { data } = await api.get("/search", { params: { q: query, limit } });
  return data;
}
