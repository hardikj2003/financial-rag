import { authenticatedFetch } from "@/lib/authenticatedFetch";

export interface DashboardMetrics {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalDocuments: number;
  totalChunks: number;
}

export interface DashboardMetricsResponse {
  metrics: DashboardMetrics;
}

export interface AdminStatusResponse {
  isAdmin: boolean;
}

export interface AdminDocument {
  id: string;
  fileName: string;
  chunksStored?: number | null;
}

export interface AdminDocumentsResponse {
  documents: AdminDocument[];
}

export const getDashboardMetrics = async (token: string) => {
  const api = await authenticatedFetch(token);
  const response = await api.get<DashboardMetricsResponse>("/admin/dashboard");

  return response.data;
};

export const getAdminStatus = async (token: string) => {
  const api = await authenticatedFetch(token);
  const response = await api.get<AdminStatusResponse>("/admin/me");

  return response.data;
};
export const getDocuments = async (token: string) => {
  const api = await authenticatedFetch(token);
  const response = await api.get<AdminDocumentsResponse>("/admin/documents");
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
