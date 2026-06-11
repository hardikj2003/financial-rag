import axios from "axios";
import { API_BASE_URL } from "@/services/api/api";

export const authenticatedFetch = async (token: string) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};
