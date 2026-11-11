import type { PaginatedResponse } from "./index";

export const RESOURCE_TYPES = [
  "image",
  "document",
  "zip",
  "apk",
  "video",
  "figma",
  "github",
  "url",
  "other",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const LINKED_TYPES = ["task", "endpoint", "design", "meeting", "report"] as const;
export type LinkedType = (typeof LINKED_TYPES)[number];

export interface Resource {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  resource_type: ResourceType;
  category?: string;
  url?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  tags: string[];
  extra_metadata: Record<string, unknown>;
  current_version: number;
  uploaded_by?: number;
  uploader?: { id: number; name: string };
  version_count: number;
  link_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceVersion {
  id: number;
  resource_id: number;
  version: number;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  extra_metadata: Record<string, unknown>;
  uploaded_by?: number;
  uploader?: { id: number; name: string };
  created_at: string;
}

export interface ResourceLink {
  id: number;
  resource_id: number;
  linked_type: LinkedType;
  linked_id: number;
  created_at: string;
}

export interface ResourceActivity {
  id: number;
  resource_id: number;
  action: "uploaded" | "updated" | "viewed" | "downloaded" | "deleted";
  user_id?: number;
  user?: { id: number; name: string };
  extra_metadata: Record<string, unknown>;
  created_at: string;
}

export type PaginatedResources = PaginatedResponse<Resource>;
