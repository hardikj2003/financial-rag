"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2, ArrowUpCircle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { uploadDocument } from "@/services/admin/admin.service";

interface Props {
  onUploadSuccess?: () => void;
}

export default function UploadBox({ onUploadSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const token = await getToken();
      if (!token) return;
      await uploadDocument(file, token);
      onUploadSuccess?.();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      await uploadFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      await uploadFile(file);
    }
  };

  const handleClick = () => {
    if (!uploading) {
      inputRef.current?.click();
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        className={`group flex flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition-all duration-300 relative overflow-hidden ${
          uploading
            ? "cursor-not-allowed border-blue-200 bg-blue-50/40"
            : isDragActive
              ? "border-blue-500 bg-blue-50/60 scale-[0.99] shadow-inner"
              : "cursor-pointer border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-2xs"
        }`}
      >
        {/* Animated Background Ring Pulse for Upload Active states */}
        {isDragActive && (
          <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 to-transparent pointer-events-none animate-pulse" />
        )}

        <div
          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 ${
            isDragActive
              ? "bg-blue-600 border-blue-700 text-white"
              : "bg-white border-slate-200 text-slate-600 group-hover:scale-105 group-hover:border-slate-300"
          }`}
        >
          {uploading ? (
            <Loader2 className="animate-spin text-blue-600" size={18} />
          ) : isDragActive ? (
            <ArrowUpCircle className="animate-bounce" size={18} />
          ) : (
            <Upload size={18} />
          )}
        </div>

        <h3 className="text-xs font-bold text-slate-800 transition-colors">
          {uploading
            ? "Ingesting Vector Pipeline..."
            : isDragActive
              ? "Release File to Start"
              : "Upload Financial Ledger"}
        </h3>

        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400 max-w-50 mx-auto">
          {uploading
            ? "Executing chunk vector models and maps..."
            : "Drop financial PDF statement here or click to browse files."}
        </p>

        <div
          className={`mt-4 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-tight uppercase transition-all duration-300 ${
            isDragActive
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-white text-slate-400 border-slate-200"
          }`}
        >
          <FileText size={10} />
          PDF Document Format
        </div>
      </div>
    </>
  );
}
