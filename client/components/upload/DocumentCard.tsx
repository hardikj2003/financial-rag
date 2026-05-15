import { FileText, CalendarDays, Database } from "lucide-react";

import { UploadedDocument } from "@/types/upload";

interface Props {
  document: UploadedDocument;
}

export default function DocumentCard({ document }: Props) {
  const formattedDate = new Date(document.uploadedAt).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 transition-all duration-300 group-hover:bg-slate-200">
          <FileText size={20} className="text-slate-700" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="wrap-break-word text-sm font-semibold leading-6 text-slate-800">
            {document.fileName}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Chunks */}
            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <Database size={11} />
              {document.chunksStored} chunks
            </div>

            {/* Upload Date */}
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <CalendarDays size={11} />
              {formattedDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
