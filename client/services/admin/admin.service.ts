import { authenticatedFetch } from "@/lib/authenticatedFetch";

export const getDashboardMetrics = async (token: string) => {
  const api = await authenticatedFetch(token);
  const response = await api.get("/admin/dashboard");

  return response.data;
};

export const getAdminStatus = async (token: string) => {
  const api = await authenticatedFetch(token);
  const response = await api.get("/admin/me");

  return response.data;
};
export const getDocuments = async (token: string) => {
  const api = await authenticatedFetch(token);
  const response = await api.get("/admin/documents");
  return response.data;
};

export const deleteDocument = async (documentId: string, token: string) => {
  const api = await authenticatedFetch(token);
  const response = await api.delete(`/admin/documents/${documentId}`);

  return response.data;
};
export const uploadDocument = async (file: File, token: string) => {
  const apiClient = await authenticatedFetch(token);
  const formData = new FormData();
  formData.append("pdf", file);
  const response = await apiClient.post("/ingestion/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
