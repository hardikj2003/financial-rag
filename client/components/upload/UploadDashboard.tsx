"use client";

import UploadBox from "./UploadBox";
import DocumentCard from "./DocumentCard";
import { uploadPDF } from "@/services/upload/upload.service";
import { useUploadStore } from "@/store/upload/upload.store";

export default function UploadDashboard() {
  const {
    documents,
    addDocument,
    loading,
    setLoading,
  } = useUploadStore();

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);
      const response = await uploadPDF(file);

      addDocument({
        id: crypto.randomUUID(),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        chunksStored: response?.chunksStored || 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <UploadBox onFileSelect={handleUpload} />

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Processing financial report...
        </div>
      )}

      <div className="flex flex-col gap-4">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}
