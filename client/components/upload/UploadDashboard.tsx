"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { uploadPDF } from "@/services/upload/upload.service";
import DocumentList from "./DocumentList";
import Toast from "../ui/Toast";

export default function UploadDashboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadedFileName(file.name);

      await uploadPDF(file, (progress) => {
        setUploadProgress(progress);
      });
      setRefreshKey((prev) => prev + 1);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setUploadProgress(0);
      setUploadedFileName("");
    }
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    setDragActive(false);

    const file = e.dataTransfer.files?.[0];

    if (file && file.type === "application/pdf") {
      await handleUpload(file);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Upload Area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();

          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`group relative overflow-hidden rounded-3xl border border-dashed bg-white p-6 transition-all duration-300 cursor-pointer ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];

            if (file) {
              await handleUpload(file);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-3xl transition-all duration-300 ${
              dragActive
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
            }`}
          >
            {uploading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <UploadCloud size={24} />
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-800">
            {uploading
              ? "Processing financial report..."
              : "Upload Financial Documents"}
          </h3>

          {/* Subtitle */}
          <p className="mt-2 max-w-xs text-xs leading-6 text-slate-400">
            Drag and drop annual reports, earnings statements, or PDF filings.
          </p>

          {/* Upload Progress */}
          {uploading ? (
            <div className="mt-6 w-full">
              {/* File Name */}
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="truncate font-medium text-stone-700">
                  {uploadedFileName}
                </span>

                <span className="text-stone-500">{uploadProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-stone-500">
                Extracting text, generating embeddings, and indexing vectors...
              </p>
            </div>
          ) : (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-600">
              <CheckCircle2 size={12} />
              PDF files supported
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      <DocumentList refreshKey={refreshKey} />
      {showToast && <Toast message="Document indexed successfully" />}
    </div>
  );
}
