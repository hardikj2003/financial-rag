"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getTraces,
  TraceListItem,
} from "@/services/observability/observability.service";
import {
  VerdictBadge,
  StatusBadge,
  fmtMs,
  fmtPct,
} from "@/components/observability/ui";

const PAGE_SIZE = 20;

export default function TracesPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<TraceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [verification, setVerification] = useState("all");
  const [queryType, setQueryType] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await getTraces(token, {
        page,
        pageSize: PAGE_SIZE,
        search,
        status,
        verification,
        queryType,
      });
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search, status, verification, queryType]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="-mx-10 -my-8 min-h-[calc(100vh-4rem)] space-y-5 bg-slate-950 px-10 py-8 text-slate-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Query Traces</h1>
          <p className="mt-1 text-xs text-slate-500">
            {total.toLocaleString()} traces · click any row to replay the pipeline
          </p>
        </div>
        <Link
          href="/admin/observability"
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-blue-500/50"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
          <Search size={15} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search queries…"
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>
        <FilterSelect
          value={status}
          onChange={(v) => { setPage(1); setStatus(v); }}
          options={[["all", "All status"], ["ok", "OK"], ["error", "Error"], ["rate_limited", "Rate limited"]]}
        />
        <FilterSelect
          value={verification}
          onChange={(v) => { setPage(1); setVerification(v); }}
          options={[["all", "All verdicts"], ["SUPPORTED", "Supported"], ["UNSUPPORTED", "Unsupported"], ["UNKNOWN", "Unknown"]]}
        />
        <FilterSelect
          value={queryType}
          onChange={(v) => { setPage(1); setQueryType(v); }}
          options={[["all", "All types"], ["FACT_LOOKUP", "Fact"], ["ANALYSIS", "Analysis"], ["COMPARISON", "Comparison"], ["SUMMARY", "Summary"]]}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Query</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Latency</th>
              <th className="px-4 py-3 font-semibold">Sources</th>
              <th className="px-4 py-3 font-semibold">Coverage</th>
              <th className="px-4 py-3 font-semibold">Verdict</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No traces match these filters.</td></tr>
            ) : (
              items.map((t) => (
                <tr key={t.id} className="group cursor-pointer hover:bg-slate-900/60">
                  <td className="max-w-xs px-4 py-3">
                    <Link href={`/admin/observability/traces/${t.id}`} className="block">
                      <span className="line-clamp-1 font-medium text-slate-200 group-hover:text-white">
                        {t.originalQuery}
                      </span>
                      {t.companies.length > 0 && (
                        <span className="text-[11px] text-slate-500">
                          {t.companies.join(" · ")}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{t.queryType ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{fmtMs(t.totalMs)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {t.citedSourceCount ?? 0}/{t.finalSourceCount ?? 0}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{fmtPct(t.citationCoverage)}</td>
                  <td className="px-4 py-3"><VerdictBadge verdict={t.verification} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 disabled:opacity-40 hover:enabled:border-slate-600"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 disabled:opacity-40 hover:enabled:border-slate-600"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500/50"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v} className="bg-slate-900">
          {label}
        </option>
      ))}
    </select>
  );
}
