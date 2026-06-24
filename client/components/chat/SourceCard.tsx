"use client";

import { useState } from "react";

import {
  FileText,
  ChevronRight,
  BadgeCheck,
  Sparkles,
  Layers3,
} from "lucide-react";

interface SourceItem {
  sourceId?: number;
  text: string;
  documentName: string;
  chunkIndex: number;
  score: number;
  sectionTitle?: string;
}

interface Props {
  source: SourceItem;
}

export default function SourceCard({ source }: Props) {
  const { sourceId, text, documentName, chunkIndex, score, sectionTitle } =
    source;
  const displaySourceId = sourceId ?? 1;

  const [expanded, setExpanded] = useState(false);

  // Confidence Estimation
  const confidence = score > 80 ? "High" : score > 50 ? "Medium" : "Low";

  const confidenceStyles =
    confidence === "High"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : confidence === "Medium"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-all duration-300 group-hover:bg-slate-200">
            <FileText size={18} />
          </div>

          {/* Metadata */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                Source {displaySourceId}
              </div>

              <h3 className="truncate text-sm font-semibold text-slate-800">
                {documentName}
              </h3>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-blue-700">
                <Sparkles size={10} />
                {sectionTitle || "General"}
              </div>

              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                <Layers3 size={10} />
                Chunk #{chunkIndex}
              </div>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${confidenceStyles}`}
        >
          <BadgeCheck size={12} />

          {confidence}
        </div>
      </div>

      {/* Preview */}
      <div className="px-5 py-4">
        <p
          className={`text-sm leading-7 text-slate-600 transition-all duration-300 ${
            expanded ? "" : "line-clamp-4"
          }`}
        >
          {text}
        </p>

        {text.length > 280 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            {expanded ? "Show less" : "Read more"}

            <ChevronRight
              size={12}
              className={`transition-transform duration-300 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <div className="text-[11px] text-slate-400">
          Citation: [Source {displaySourceId}]
        </div>
      </div>
    </div>
  );
}
