import { api } from "@/services/api";
import type { User } from "@/types";

export const profileService = {
  update(data: { name?: string; email?: string; job_title?: string; password?: string }) {
    return api.put<User>("/auth/me", data).then((r) => r.data);
  },
};
