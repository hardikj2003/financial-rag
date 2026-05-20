import api from "../api/api";

export const uploadPDF = async (
  file: File,
  onProgress?: (progress: number) => void,
) => {
  const formData = new FormData();

  formData.append("pdf", file);

  const response = await api.post("/ingestion/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },

    onUploadProgress: (progressEvent) => {
      if (!progressEvent.total) return;

      const progress = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total,
      );

      onProgress?.(progress);
    },
  });

  return response.data;
};
