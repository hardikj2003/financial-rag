"use client";

import { useRef } from "react";

import { Upload, FileText } from "lucide-react";

interface Props {
  onFileSelect: (file: File) => void;
}

export default function UploadBox({ onFileSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
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
        onDragOver={(e) => e.preventDefault()}
        className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 transition-all duration-300 hover:border-slate-400 hover:bg-slate-100/40"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 transition-all duration-300 group-hover:scale-105 group-hover:bg-slate-200">
          <Upload className="text-slate-700" />
        </div>

        <h3 className="text-sm font-semibold text-slate-800">
          Upload Financial Reports
        </h3>

        <p className="mt-2 text-center text-xs leading-6 text-slate-400">
          Drag & drop PDF files here
          <br />
          or click to browse
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
          <FileText size={12} />
          PDF only
        </div>
      </div>
    </>
  );
}
