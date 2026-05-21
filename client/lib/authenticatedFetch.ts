import { api } from "@/services/api/api";

export const authenticatedFetch = async (token: string) => {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;

  return api;
};
