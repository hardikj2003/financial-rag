"use client";

import { ReactNode, useState } from "react";
import { ChevronRight } from "lucide-react";

export const fmtMs = (ms?: number | null) =>
  ms == null ? "—" : ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;

export const fmtPct = (n?: number | null) =>
  n == null ? "—" : `${(n * 100).toFixed(0)}%`;

export const fmtNum = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString();

export const fmtCost = (n?: number | null) =>
  n == null ? "—" : `$${n.toFixed(4)}`;

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "blue" | "emerald" | "amber" | "red";
}) {
  const accentColor =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "amber"
        ? "text-amber-400"
        : accent === "red"
          ? "text-red-400"
          : "text-slate-100";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-2 font-mono text-2xl font-bold ${accentColor}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/40 p-5 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Collapsible({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-slate-800/40"
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            size={16}
            className={`text-slate-500 transition-transform ${open ? "rotate-90" : ""}`}
          />
          <span className="text-sm font-semibold text-slate-200">{title}</span>
        </div>
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </button>
      {open && (
        <div className="border-t border-slate-800 px-5 py-4">{children}</div>
      )}
    </div>
  );
}

export function VerdictBadge({ verdict }: { verdict?: string | null }) {
  const map: Record<string, string> = {
    SUPPORTED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    UNSUPPORTED: "border-red-500/30 bg-red-500/10 text-red-300",
    UNKNOWN: "border-slate-600 bg-slate-800 text-slate-400",
    DISABLED: "border-slate-700 bg-slate-800/50 text-slate-500",
  };
  const cls = map[verdict ?? ""] ?? map.UNKNOWN;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {verdict ?? "—"}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "rate_limited"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-red-500/30 bg-red-500/10 text-red-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {status}
    </span>
  );
}

export function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs text-slate-400">{score.toFixed(1)}</span>
    </div>
  );
}
