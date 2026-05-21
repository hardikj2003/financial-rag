"use client";

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | undefined;
  loading?: boolean;
  icon: LucideIcon;
  description?: string;
  isHighlight?: boolean;
}

export default function MetricCard({
  title,
  value,
  loading = false,
  icon: Icon,
  description,
  isHighlight = false,
}: MetricCardProps) {
  const displayValue = value?.toLocaleString() ?? "0";

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 ${
        isHighlight
          ? "border-emerald-600 bg-slate-900 text-white shadow-md shadow-slate-900/10"
          : "border-slate-200 bg-white shadow-2xs hover:shadow-sm hover:border-slate-300"
      }`}
    >
      {/* Upper Meta Row */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isHighlight ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          {title}
        </span>
        <div
          className={`p-2 rounded-xl border ${
            isHighlight
              ? "bg-slate-800 border-slate-700 text-emerald-400"
              : "bg-slate-50 border-slate-100 text-slate-500"
          }`}
        >
          <Icon size={14} />
        </div>
      </div>

      {/* Main Metric Output Display block */}
      <div className="space-y-1 mt-2">
        {loading ? (
          <div className="h-7 w-20 animate-pulse bg-slate-200 rounded-md my-1" />
        ) : (
          <h3 className="text-2xl font-bold tracking-tight font-mono leading-none">
            {displayValue}
          </h3>
        )}

        {description && (
          <p
            className={`text-[10px] font-medium ${
              isHighlight ? "text-slate-400" : "text-slate-400"
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {/* Abstract background graphics decoration for highlighting */}
      {isHighlight && (
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
      )}
    </div>
  );
}
