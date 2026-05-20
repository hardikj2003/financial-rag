import api from "../api/api";

export const deleteDocument = async (documentId: string) => {
  const response = await api.delete(`/documents/${documentId}`);

  return response.data;
};
