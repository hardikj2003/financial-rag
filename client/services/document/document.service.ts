import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { api } from "../api/api";

export const deleteDocument = async (documentId: string,token: string) => {
  const apiClient = await authenticatedFetch(token);
  const response = await apiClient.delete(`/documents/${documentId}`);
  return response.data;
};

export const getDocuments = async (token: string) => {
  const apiClient = await authenticatedFetch(token);
  const response = await apiClient.get("/documents");

  return response.data;
};
