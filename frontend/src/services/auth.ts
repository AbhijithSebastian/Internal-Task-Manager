import api from "./api";
import type { LoginResponse, User } from "@/types";

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    job_title?: string;
  }): Promise<LoginResponse> {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const { data } = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get("/auth/me");
    return data;
  },
};
