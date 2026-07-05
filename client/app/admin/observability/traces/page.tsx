"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
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
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-300 md:px-10 antialiased">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Setup */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Layers size={18} className="text-blue-500" /> Pipeline Execution
              Traces
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {total.toLocaleString()} traces indexed · Select a row instance to
              inspect context evaluation
            </p>
          </div>
          <Link
            href="/admin/observability"
            className="self-start rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
          >
            ← System Overview
          </Link>
        </div>

        {/* Filter Toolbar Component */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-900 bg-slate-900/20 px-3 py-1.5 focus-within:border-slate-800 transition-colors">
            <Search size={14} className="text-slate-600" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Filter trace vector contents..."
              className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterSelect
              value={status}
              onChange={(v) => {
                setPage(1);
                setStatus(v);
              }}
              options={[
                ["all", "All statuses"],
                ["ok", "Success (OK)"],
                ["error", "Failures"],
                ["rate_limited", "Rate Limiting"],
              ]}
            />
            <FilterSelect
              value={verification}
              onChange={(v) => {
                setPage(1);
                setVerification(v);
              }}
              options={[
                ["all", "All verdicts"],
                ["SUPPORTED", "Supported"],
                ["UNSUPPORTED", "Unsupported"],
                ["UNKNOWN", "Evaluation Unresolved"],
              ]}
            />
            <FilterSelect
              value={queryType}
              onChange={(v) => {
                setPage(1);
                setQueryType(v);
              }}
              options={[
                ["all", "All structural intents"],
                ["FACT_LOOKUP", "Fact Search"],
                ["ANALYSIS", "Deep Analysis"],
                ["COMPARISON", "Matrix Comparison"],
                ["SUMMARY", "Document Abstraction"],
              ]}
            />
          </div>
        </div>

        {/* Structured Data Table */}
        <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/30 border-b border-slate-900 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-1/3">Query Execution Sequence</th>
                  <th className="px-4 py-3">Vector Intent</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Sources Fetch</th>
                  <th className="px-4 py-3">Citation Rate</th>
                  <th className="px-4 py-3">Safety Verdict</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-slate-600 animate-pulse font-mono"
                    >
                      Synchronizing live traces…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-slate-600 italic"
                    >
                      No historical traces identified within current filter
                      bounds.
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <tr
                      key={t.id}
                      className="group cursor-pointer hover:bg-slate-900/20 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/observability/traces/${t.id}`}
                          className="block space-y-1"
                        >
                          <span className="line-clamp-1 font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                            {t.originalQuery}
                          </span>
                          {t.companies.length > 0 && (
                            <span className="block font-mono text-[10px] text-slate-600">
                              {t.companies.join(" · ")}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {t.queryType ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {fmtMs(t.totalMs)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {t.citedSourceCount ?? 0}{" "}
                        <span className="text-slate-700">/</span>{" "}
                        {t.finalSourceCount ?? 0}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {fmtPct(t.citationCoverage)}
                      </td>
                      <td className="px-4 py-3.5">
                        <VerdictBadge verdict={t.verification} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500 font-mono">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Minimal Control Pagination */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-2">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-md border border-slate-900 bg-slate-900/10 px-2.5 py-1.5 disabled:opacity-30 hover:enabled:bg-slate-900 text-slate-300 transition-colors"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-md border border-slate-900 bg-slate-900/10 px-2.5 py-1.5 disabled:opacity-30 hover:enabled:bg-slate-900 text-slate-300 transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
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
      className="rounded-lg border border-slate-900 bg-slate-900/20 px-2.5 py-1.5 text-xs text-slate-400 outline-none focus:border-slate-800 transition-all cursor-pointer"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v} className="bg-slate-950 text-slate-300">
          {label}
        </option>
      ))}
    </select>
  );
}
