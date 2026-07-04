export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const ENDPOINT_STATUSES = ["draft", "review", "active", "deprecated"] as const;
export type EndpointStatus = (typeof ENDPOINT_STATUSES)[number];

export const REFERENCE_TYPES = ["task", "resource", "design", "meeting"] as const;
export type ReferenceType = (typeof REFERENCE_TYPES)[number];

export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: string;
  example?: string;
}

export interface EndpointStatusCode {
  code: number;
  description: string;
}

export interface EndpointExample {
  title?: string;
  content: string;
  lang?: string;
}

export interface Endpoint {
  id: number;
  project_id: number;
  name: string;
  method: HttpMethod;
  url: string;
  description?: string;
  authentication?: Record<string, unknown>;
  headers: EndpointParameter[];
  query_params: EndpointParameter[];
  path_params: EndpointParameter[];
  request_body?: Record<string, unknown>;
  response_body?: Record<string, unknown>;
  status_codes: EndpointStatusCode[];
  example_requests: EndpointExample[];
  example_responses: EndpointExample[];
  tags: string[];
  version: string;
  status: EndpointStatus;
  owner_id?: number;
  owner?: { id: number; name: string };
  reference_count: number;
  activity_count: number;
  created_at: string;
  updated_at: string;
}

export interface EndpointReference {
  id: number;
  endpoint_id: number;
  linked_type: ReferenceType;
  linked_id: number;
  created_at: string;
}

export interface EndpointActivity {
  id: number;
  endpoint_id: number;
  action: string;
  user_id?: number;
  user?: { id: number; name: string };
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedEndpoints {
  items: Endpoint[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
