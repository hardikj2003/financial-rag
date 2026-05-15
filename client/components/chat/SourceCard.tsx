import { FileText, ChevronRight } from "lucide-react";

interface SourceItem {
  text: string;
  documentName: string;
  chunkIndex: number;
  score: number;
}

interface Props {
  source: SourceItem;
}

export default function SourceCard({ source }: Props) {
  const documentName = source?.documentName || "Financial Report";
  const chunkIndex = source?.chunkIndex ?? 0;
  const text = typeof source?.text === "string" ? source.text : "";
  const relevanceScore = Math.min(
    Math.max(Math.round((source?.score || 0) * 100), 0),
    100,
  );

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-all duration-300 group-hover:bg-slate-200">
            <FileText size={18} className="text-slate-700" />
          </div>

          {/* Metadata */}
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-slate-800">
              {documentName}
            </h4>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Chunk #{chunkIndex}
            </p>
          </div>
        </div>

        {/* Relevance Score */}
        <div className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          {relevanceScore}% match
        </div>
      </div>

      {/* Source Text */}
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="line-clamp-4 text-xs leading-6 text-slate-600">{text}</p>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-end">
        <button className="flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-700">
          Source Context
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
