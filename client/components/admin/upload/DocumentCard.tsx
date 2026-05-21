"use client";

import { FileText, Database, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteDocument } from "@/services/document/document.service";
import { UploadedDocument } from "@/types/upload";

interface Props {
  document: UploadedDocument;
}

export default function DocumentCard({ document }: Props) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg">
      {/* Top */}
      <div className="flex items-start gap-4 px-5 py-5">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 transition-all duration-300 group-hover:bg-stone-200">
          <FileText size={20} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* File Name */}
          <h3 className="truncate text-sm font-semibold text-stone-800">
            {document.fileName}
          </h3>

          {/* Metadata Tags */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-medium text-stone-600">
              <Database size={10} />
              {document.chunksStored} Chunks
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-medium text-orange-700">
              <Sparkles size={10} />
              Retrieval Ready
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/60 px-5 py-4">
        {/* Left */}
        <div className="text-[11px] text-stone-400">
          Vector embeddings indexed
        </div>

        {/* Delete */}
        <button
          disabled={deleting}
          onClick={async () => {
            try {
              setDeleting(true);

              await deleteDocument(document.id);

              window.location.reload();
            } catch (error) {
              console.error(error);
            } finally {
              setDeleting(false);
            }
          }}
          className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-all duration-300 hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}

          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
