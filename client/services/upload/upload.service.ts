import api from "../api/api";

export const uploadPDF = async (file: File) => {
  const formData = new FormData();

  formData.append("pdf", file);

  const response = await api.post(
    "/ingestion/upload",

    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};
