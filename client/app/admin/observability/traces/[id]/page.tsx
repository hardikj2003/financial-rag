"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  getTraceDetail,
  TraceDetail,
  RetrievalResult,
} from "@/services/observability/observability.service";
import {
  Panel,
  Collapsible,
  StatCard,
  VerdictBadge,
  StatusBadge,
  ScoreBar,
  fmtMs,
  fmtPct,
  fmtNum,
  fmtCost,
} from "@/components/observability/ui";

export default function TraceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [trace, setTrace] = useState<TraceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        setTrace(await getTraceDetail(token, id));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getToken, id]);

  if (loading) return <Shell><p className="text-slate-500">Loading trace…</p></Shell>;
  if (!trace) return <Shell><p className="text-red-400">Trace not found.</p></Shell>;

  // Timeline derived from recorded stage durations.
  const stages = [
    { name: "Retrieval", ms: trace.retrievalMs },
    { name: "Generation", ms: trace.generationMs },
  ].filter((s) => s.ms != null) as { name: string; ms: number }[];
  const maxStage = Math.max(...stages.map((s) => s.ms), 1);

  return (
    <Shell>
      <Link
        href="/admin/observability/traces"
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        ← Back to traces
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-white">{trace.originalQuery}</p>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(trace.createdAt).toLocaleString()} ·{" "}
              {trace.queryType ?? "—"} · {trace.model ?? "—"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <StatusBadge status={trace.status} />
            <VerdictBadge verdict={trace.verification} />
          </div>
        </div>
        {trace.errorMessage && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {trace.errorMessage}
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard label="End-to-End" value={fmtMs(trace.totalMs)} accent="blue" />
          <StatCard label="Retrieval" value={fmtMs(trace.retrievalMs)} />
          <StatCard label="Generation" value={fmtMs(trace.generationMs)} />
          <StatCard label="Sources" value={`${trace.citedSourceCount ?? 0}/${trace.finalSourceCount ?? 0}`} hint="cited/used" />
          <StatCard label="Tokens" value={fmtNum((trace.estInputTokens ?? 0) + (trace.estOutputTokens ?? 0))} hint="est." />
          <StatCard label="Cost" value={fmtCost(trace.estCostUsd)} accent="amber" />
        </div>
      </div>

      {/* Timeline */}
      <Panel title="Stage Timeline">
        <div className="space-y-2">
          {stages.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-slate-400">{s.name}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-slate-800">
                <div
                  className="flex h-full items-center justify-end rounded bg-blue-500/70 px-2"
                  style={{ width: `${(s.ms / maxStage) * 100}%` }}
                >
                  <span className="font-mono text-[10px] text-white">{fmtMs(s.ms)}</span>
                </div>
              </div>
            </div>
          ))}
          {trace.verificationMs != null && (
            <p className="text-[11px] text-slate-500">
              + verification {fmtMs(trace.verificationMs)} (async, off request path)
            </p>
          )}
        </div>
      </Panel>

      {/* Query transformation */}
      <Collapsible title="Query Transformation" defaultOpen subtitle={trace.isComparison ? "comparison" : trace.queryType ?? ""}>
        <div className="space-y-3 text-sm">
          <Field label="Original" value={trace.originalQuery} />
          <Field label="Rewritten (standalone)" value={trace.rewrittenQuery ?? "— (no rewrite)"} />
          {trace.generatedQueries.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">Generated search queries</p>
              <ul className="space-y-1">
                {trace.generatedQueries.map((q, i) => (
                  <li key={i} className="rounded bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300">{q}</li>
                ))}
              </ul>
            </div>
          )}
          {trace.companies.length > 0 && (
            <Field label="Companies detected" value={trace.companies.join(", ")} />
          )}
        </div>
      </Collapsible>

      {/* Retrieval debugger */}
      <Collapsible title="Retrieval Debugger" subtitle={`${trace.retrievals.length} rounds`}>
        <div className="space-y-4">
          {trace.retrievals.length === 0 ? (
            <p className="text-sm text-slate-500">No retriever data captured.</p>
          ) : (
            trace.retrievals.map((r) => (
              <div key={r.id}>
                <p className="mb-2 text-xs font-semibold text-slate-400">
                  <span className="rounded bg-slate-800 px-2 py-0.5 uppercase tracking-wide text-blue-300">
                    {r.retriever}
                  </span>{" "}
                  {r.company && <span className="text-slate-500">· {r.company}</span>}{" "}
                  <span className="text-slate-600">· {r.resultCount} results · “{r.searchQuery}”</span>
                </p>
                <ResultsTable results={r.results} />
              </div>
            ))
          )}
        </div>
      </Collapsible>

      {/* Fusion debugger */}
      {trace.fusion && (
        <Collapsible title="RRF Fusion" subtitle={`${trace.fusion.beforeCount} → ${trace.fusion.afterCount}`}>
          <p className="mb-3 text-xs text-slate-500">
            Survivors after Reciprocal Rank Fusion + metadata boost (fused score is canonical).
          </p>
          <ResultsTable results={trace.fusion.items} showScore />
        </Collapsible>
      )}

      {/* Reranker debugger */}
      {trace.rerank && (
        <Collapsible title="Reranker" subtitle={`${trace.rerank.beforeCount} → ${trace.rerank.afterCount}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Document</th>
                  <th className="py-2 pr-3">Before</th>
                  <th className="py-2 pr-3">After</th>
                  <th className="py-2">Movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trace.rerank.items.map((it) => {
                  const delta = it.afterScore - it.beforeScore;
                  return (
                    <tr key={it.id}>
                      <td className="py-2 pr-3 font-mono text-slate-500">{it.rank}</td>
                      <td className="py-2 pr-3 text-slate-300">{it.documentName}</td>
                      <td className="py-2 pr-3 font-mono text-slate-500">{it.beforeScore.toFixed(2)}</td>
                      <td className="py-2 pr-3 font-mono text-slate-300">{it.afterScore.toFixed(2)}</td>
                      <td className="py-2 font-mono">
                        <span className={delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-slate-500"}>
                          {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Collapsible>
      )}

      {/* Context selection (compression was removed; this shows selection ratio) */}
      <Collapsible
        title="Context Selection"
        subtitle={`${trace.candidateCount ?? 0} → ${trace.finalSourceCount ?? 0}`}
      >
        <p className="text-sm text-slate-400">
          {trace.candidateCount ?? 0} candidates were narrowed to{" "}
          {trace.finalSourceCount ?? 0} final sources (
          {trace.candidateCount
            ? `${Math.round((1 - (trace.finalSourceCount ?? 0) / trace.candidateCount) * 100)}% reduction`
            : "—"}
          ). Sentence-level context compression was intentionally removed from
          the pipeline — it severed figures from their labels. Context is{" "}
          {fmtNum(trace.contextChars)} chars.
        </p>
      </Collapsible>

      {/* Prompt inspector */}
      {trace.prompt && (
        <Collapsible title="Prompt Inspector" subtitle={`${fmtNum(trace.prompt.estTokens)} tokens`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Characters" value={fmtNum(trace.prompt.chars)} />
            <StatCard label="Est. Tokens" value={fmtNum(trace.prompt.estTokens)} />
            <StatCard label="Context Chars" value={fmtNum(trace.contextChars)} />
          </div>
          <PromptBlock label="System Prompt" text={trace.prompt.systemPrompt} />
          <PromptBlock label="Retrieved Context" text={trace.prompt.context} />
          <PromptBlock label="Final Prompt" text={trace.prompt.finalPrompt} />
        </Collapsible>
      )}

      {/* LLM monitoring */}
      {trace.llm && (
        <Collapsible title="LLM Generation" subtitle={trace.llm.model}>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Input Tokens" value={fmtNum(trace.llm.inputTokens)} />
            <StatCard label="Output Tokens" value={fmtNum(trace.llm.outputTokens)} />
            <StatCard label="Total Tokens" value={fmtNum(trace.llm.totalTokens)} />
            <StatCard label="Latency" value={fmtMs(trace.llm.latencyMs)} />
            <StatCard label="Stream" value={fmtMs(trace.llm.streamMs)} />
            <StatCard label="Cost" value={fmtCost(trace.llm.costUsd)} accent="amber" />
          </div>
        </Collapsible>
      )}

      {/* Source attribution */}
      {trace.verificationTrace && (
        <Collapsible
          title="Source Attribution"
          subtitle={`${trace.verificationTrace.citedSources}/${trace.verificationTrace.totalSources} cited`}
        >
          <div className="space-y-2">
            {trace.verificationTrace.evidence.map((e) => (
              <div
                key={e.sourceId}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2.5"
              >
                <span className="text-sm text-slate-300">
                  <span className="font-mono text-slate-500">[Source {e.sourceId}]</span>{" "}
                  {e.documentName}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    e.cited
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-700 bg-slate-800 text-slate-500"
                  }`}
                >
                  {e.cited ? "CITED" : "unused"}
                </span>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Verification */}
      <Collapsible title="Verification" subtitle={trace.verification ?? "—"}>
        <div className="flex items-center gap-4">
          <VerdictBadge verdict={trace.verification} />
          <span className="text-sm text-slate-400">
            Citation coverage: {fmtPct(trace.citationCoverage)}
          </span>
        </div>
      </Collapsible>

      {/* Memory inspector */}
      <Collapsible title="Conversation Memory" subtitle={trace.memoryCompany ?? "no company"}>
        <div className="space-y-3 text-sm">
          <Field label="Current company" value={trace.memoryCompany ?? "—"} />
          <Field label="Recent topics" value={trace.memoryTopics.join(", ") || "—"} />
        </div>
      </Collapsible>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-10 -my-8 min-h-[calc(100vh-4rem)] space-y-4 bg-slate-950 px-10 py-8 text-slate-300">
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-300">{value}</p>
    </div>
  );
}

function PromptBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] leading-5 text-slate-400 whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}

function ResultsTable({
  results,
  showScore,
}: {
  results: RetrievalResult[];
  showScore?: boolean;
}) {
  if (!results || results.length === 0) {
    return <p className="text-xs text-slate-600">No results.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-900/60 text-slate-500">
          <tr>
            <th className="px-3 py-2">Document</th>
            <th className="px-3 py-2">Company</th>
            <th className="px-3 py-2">Section</th>
            <th className="px-3 py-2">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {results.map((r, i) => (
            <tr key={`${r.id}-${i}`}>
              <td className="px-3 py-2 text-slate-300">{r.documentName}</td>
              <td className="px-3 py-2 text-slate-500">{r.companyName ?? "—"}</td>
              <td className="px-3 py-2 text-slate-500">{r.sectionTitle ?? "—"}</td>
              <td className="px-3 py-2">
                {showScore ? <ScoreBar score={r.score} max={1} /> : (
                  <span className="font-mono text-slate-400">{r.score?.toFixed?.(3) ?? r.score}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
