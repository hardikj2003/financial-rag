"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Clock, Layers, Cpu, Database, Eye } from "lucide-react";
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

  if (loading)
    return (
      <Shell>
        <div className="flex h-40 items-center justify-center text-xs text-slate-500 animate-pulse">
          Loading trace execution…
        </div>
      </Shell>
    );
  if (!trace)
    return (
      <Shell>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          Trace parameters could not be resolved or found.
        </div>
      </Shell>
    );

  const stages = [
    { name: "Retrieval", ms: trace.retrievalMs },
    { name: "Generation", ms: trace.generationMs },
  ].filter((s) => s.ms != null) as { name: string; ms: number }[];
  const maxStage = Math.max(...stages.map((s) => s.ms), 1);

  return (
    <Shell>
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <Link
          href="/admin/observability/traces"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} /> Back to execution history
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={trace.status} />
          <VerdictBadge verdict={trace.verification} />
        </div>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <div>
          <h1 className="font-mono text-lg font-semibold tracking-tight text-white">
            {trace.originalQuery}
          </h1>
          <p className="mt-1.5 text-xs text-slate-500">
            {new Date(trace.createdAt).toLocaleString()}{" "}
            <span className="mx-2 text-slate-800">|</span>{" "}
            {trace.queryType ?? "STANDARD"}{" "}
            <span className="mx-2 text-slate-800">|</span>{" "}
            <span className="font-mono">{trace.model ?? "—"}</span>
          </p>
        </div>

        {trace.errorMessage && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 font-mono text-xs text-red-400">
            <span className="font-semibold">Pipeline Execution Error:</span>{" "}
            {trace.errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="End-to-End"
            value={fmtMs(trace.totalMs)}
            accent="blue"
          />
          <StatCard label="Retrieval" value={fmtMs(trace.retrievalMs)} />
          <StatCard label="Generation" value={fmtMs(trace.generationMs)} />
          <StatCard
            label="Sources (Cited/Total)"
            value={`${trace.citedSourceCount ?? 0} / ${trace.finalSourceCount ?? 0}`}
          />
          <StatCard
            label="Tokens"
            value={fmtNum(
              (trace.estInputTokens ?? 0) + (trace.estOutputTokens ?? 0),
            )}
            hint="est."
          />
          <StatCard
            label="Cost"
            value={fmtCost(trace.estCostUsd)}
            accent="amber"
          />
        </div>
      </div>

      {/* Timeline Visualizer */}
      <Panel title="Execution Breakdown">
        <div className="space-y-3 py-1">
          {stages.map((s) => (
            <div key={s.name} className="flex items-center gap-4">
              <span className="w-20 text-xs font-medium text-slate-400">
                {s.name}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-slate-900/60 border border-slate-900">
                <div
                  className="flex h-full items-center justify-end bg-linear-to-r from-blue-600/40 to-blue-500/50 px-2 transition-all"
                  style={{ width: `${(s.ms / maxStage) * 100}%` }}
                >
                  <span className="font-mono text-[10px] font-medium text-slate-200">
                    {fmtMs(s.ms)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {trace.verificationMs != null && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Clock size={12} />
              <span>
                Async verification completed off-path in{" "}
                {fmtMs(trace.verificationMs)}
              </span>
            </div>
          )}
        </div>
      </Panel>

      {/* Query Pipeline Steps */}
      <div className="space-y-3">
        <Collapsible
          title="Query Transformation"
          defaultOpen
          subtitle={
            trace.isComparison
              ? "Comparison Pipeline"
              : (trace.queryType ?? "Standard Lookup")
          }
        >
          <div className="space-y-4 rounded-xl border border-slate-900 bg-slate-900/20 p-4 text-xs">
            <Field label="User Input Vector" value={trace.originalQuery} mono />
            <Field
              label="Rewritten Standalone Query"
              value={trace.rewrittenQuery ?? "— (Passed unmodified)"}
              mono
            />

            {trace.generatedQueries.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-slate-500">
                  Fan-out Multiplexed Search Vectors
                </p>
                <div className="space-y-1">
                  {trace.generatedQueries.map((q, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-900/40 border border-slate-900 px-3 py-2 font-mono text-slate-300"
                    >
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {trace.companies.length > 0 && (
              <Field
                label="Extracted Entity Context"
                value={trace.companies.join(", ")}
              />
            )}
          </div>
        </Collapsible>

        <Collapsible
          title="Multi-Index Retrieval"
          subtitle={`${trace.retrievals.length} operational rounds`}
        >
          <div className="space-y-4">
            {trace.retrievals.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No storage/index fetches recorded for this execution.
              </p>
            ) : (
              trace.retrievals.map((r) => (
                <div key={r.id} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-900 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-950 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-400 border border-blue-900/40 uppercase">
                        {r.retriever}
                      </span>
                      {r.company && <span className="text-slate-600">·</span>}
                      <span className="text-slate-300">{r.company}</span>
                    </div>
                    <span className="font-mono text-slate-500">
                      {r.resultCount} hits for "{r.searchQuery}"
                    </span>
                  </div>
                  <ResultsTable results={r.results} />
                </div>
              ))
            )}
          </div>
        </Collapsible>

        {trace.fusion && (
          <Collapsible
            title="Reciprocal Rank Fusion (RRF)"
            subtitle={`Merged ${trace.fusion.beforeCount} down to ${trace.fusion.afterCount}`}
          >
            <p className="mb-2 text-xs text-slate-500">
              Cross-index canonical reranking using reciprocal weight scoring
              bounds.
            </p>
            <ResultsTable results={trace.fusion.items} showScore />
          </Collapsible>
        )}

        {trace.rerank && (
          <Collapsible
            title="Cross-Encoder Reranker"
            subtitle={`Rescored ${trace.rerank.beforeCount} → ${trace.rerank.afterCount}`}
          >
            <div className="overflow-x-auto rounded-xl border border-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/40 text-slate-500 border-b border-slate-900">
                  <tr>
                    <th className="p-3 font-medium">Rank</th>
                    <th className="p-3 font-medium">Document ID</th>
                    <th className="p-3 font-medium">Base Score</th>
                    <th className="p-3 font-medium">Model Rescore</th>
                    <th className="p-3 font-medium text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {trace.rerank.items.map((it) => {
                    const delta = it.afterScore - it.beforeScore;
                    return (
                      <tr key={it.id} className="hover:bg-slate-900/20">
                        <td className="p-3 font-mono text-slate-500">
                          {it.rank}
                        </td>
                        <td className="p-3 font-medium text-slate-300">
                          {it.documentName}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {it.beforeScore.toFixed(3)}
                        </td>
                        <td className="p-3 font-mono text-slate-200">
                          {it.afterScore.toFixed(3)}
                        </td>
                        <td className="p-3 font-mono text-right">
                          <span
                            className={
                              delta > 0
                                ? "text-emerald-400"
                                : delta < 0
                                  ? "text-red-400"
                                  : "text-slate-500"
                            }
                          >
                            {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"}{" "}
                            {Math.abs(delta).toFixed(3)}
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

        <Collapsible
          title="Context Engineering & Prompt Assembly"
          subtitle={`${fmtNum(trace.contextChars)} characters populated`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Candidate pools filtered to {trace.finalSourceCount ?? 0} targeted
              nodes. Token footprint reduction calculated at{" "}
              <span className="font-semibold text-slate-200">
                {trace.candidateCount
                  ? `${Math.round((1 - (trace.finalSourceCount ?? 0) / trace.candidateCount) * 100)}%`
                  : "0%"}
              </span>
              .
            </p>
            {trace.prompt && (
              <div className="space-y-4">
                <PromptBlock
                  label="System Payload Constraints"
                  text={trace.prompt.systemPrompt}
                />
                <PromptBlock
                  label="Injected Context Array"
                  text={trace.prompt.context}
                />
                <PromptBlock
                  label="Assembled Wire Prompt"
                  text={trace.prompt.finalPrompt}
                />
              </div>
            )}
          </div>
        </Collapsible>

        {trace.llm && (
          <Collapsible
            title="LLM Inference Execution"
            subtitle={trace.llm.model}
          >
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard
                label="Input Tokens"
                value={fmtNum(trace.llm.inputTokens)}
              />
              <StatCard
                label="Output Tokens"
                value={fmtNum(trace.llm.outputTokens)}
              />
              <StatCard
                label="Total Footprint"
                value={fmtNum(trace.llm.totalTokens)}
              />
              <StatCard
                label="Inference Wall-Time"
                value={fmtMs(trace.llm.latencyMs)}
              />
              <StatCard
                label="Time-to-First-Token"
                value={fmtMs(trace.llm.streamMs)}
              />
              <StatCard
                label="Computed Cost"
                value={fmtCost(trace.llm.costUsd)}
                accent="amber"
              />
            </div>
          </Collapsible>
        )}

        {trace.verificationTrace && (
          <Collapsible
            title="Deterministic Verification Claims"
            subtitle={`${trace.verificationTrace.citedSources} of ${trace.verificationTrace.totalSources} utilized`}
          >
            <div className="divide-y divide-slate-900 rounded-xl border border-slate-900">
              {trace.verificationTrace.evidence.map((e) => (
                <div
                  key={e.sourceId}
                  className="flex items-center justify-between p-3 text-xs bg-slate-900/10 hover:bg-slate-900/30 transition-colors"
                >
                  <span className="text-slate-300 font-medium">
                    <span className="font-mono text-slate-600 mr-2">
                      [{String(e.sourceId).padStart(2, "0")}]
                    </span>{" "}
                    {e.documentName}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider ${e.cited ? "bg-emerald-950 text-emerald-400 border border-emerald-900/50" : "bg-slate-900 text-slate-600"}`}
                  >
                    {e.cited ? "CITED" : "UNUSED"}
                  </span>
                </div>
              ))}
            </div>
          </Collapsible>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen space-y-6 bg-slate-950 px-6 py-8 text-slate-300 md:px-10 antialiased">
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p
        className={`text-xs text-slate-200 leading-relaxed ${mono ? "font-mono bg-slate-900/30 p-2 rounded border border-slate-900/60" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function PromptBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <pre className="max-h-56 overflow-auto rounded-xl border border-slate-900 bg-slate-950 p-3 font-mono text-[11px] leading-5 text-slate-400 whitespace-pre-wrap custom-scrollbar">
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
  if (!results || results.length === 0)
    return (
      <p className="text-xs text-slate-600 italic p-1">
        No contextual rows found.
      </p>
    );
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-900">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-900/40 text-slate-500 border-b border-slate-900">
          <tr>
            <th className="p-2.5 font-medium">Source Document</th>
            <th className="p-2.5 font-medium">Entity Context</th>
            <th className="p-2.5 font-medium">Node Target</th>
            <th className="p-2.5 font-medium w-32">Weight / Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900">
          {results.map((r, i) => (
            <tr key={`${r.id}-${i}`} className="hover:bg-slate-900/10">
              <td className="p-2.5 text-slate-300 font-medium">
                {r.documentName}
              </td>
              <td className="p-2.5 text-slate-400">{r.companyName ?? "—"}</td>
              <td className="p-2.5 text-slate-500">{r.sectionTitle ?? "—"}</td>
              <td className="p-2.5">
                {showScore ? (
                  <ScoreBar score={r.score} max={1} />
                ) : (
                  <span className="font-mono text-slate-400 font-medium">
                    {r.score?.toFixed?.(3) ?? r.score}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
