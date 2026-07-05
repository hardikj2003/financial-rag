"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Activity,
  ArrowRight,
  Server,
  Compass,
  ShieldAlert,
} from "lucide-react";
import {
  getSummary,
  getTimeseries,
  DashboardSummary,
  TimeseriesPoint,
} from "@/services/observability/observability.service";
import { LineChart, BarList } from "@/components/observability/Charts";
import {
  StatCard,
  Panel,
  fmtMs,
  fmtPct,
  fmtNum,
  fmtCost,
} from "@/components/observability/ui";

export default function ObservabilityOverview() {
  const { getToken } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [s, ts] = await Promise.all([
          getSummary(token),
          getTimeseries(token, 14),
        ]);
        setSummary(s);
        setSeries(ts);
      } catch {
        setError("Telemetry network sync timeout.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getToken]);

  if (loading)
    return (
      <DarkShell>
        <div className="flex h-40 items-center justify-center text-xs text-slate-500 animate-pulse font-mono">
          Aggregating engine telemetry arrays…
        </div>
      </DarkShell>
    );
  if (error || !summary)
    return (
      <DarkShell>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400 font-mono">
          {error ?? "Telemetry offline."}
        </div>
      </DarkShell>
    );

  const { usage, ai, quality, financial, failures } = summary;

  return (
    <DarkShell>
      {/* Overview Metric Topbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <Activity size={18} className="text-blue-500" /> RAG System
            Telemetry
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time verification metrics and search execution patterns across
            the final 30-day index
          </p>
        </div>
        <Link
          href="/admin/observability/traces"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-900 hover:text-white"
        >
          Inspect Real-time Traces <ArrowRight size={14} />
        </Link>
      </div>

      {/* Metrics Core Grid */}
      <div className="space-y-6">
        <Section title="Load Context" icon={<Server size={12} />}>
          <StatCard
            label="Total Core Queries"
            value={fmtNum(usage.totalQueries)}
          />
          <StatCard
            label="Total Context Chats"
            value={fmtNum(usage.totalChats)}
          />
          <StatCard
            label="Active Direct Users"
            value={fmtNum(usage.activeUsers)}
            hint="30d loop"
          />
          <StatCard label="Today" value={fmtNum(usage.dailyQueries)} />
          <StatCard label="Rolling Week" value={fmtNum(usage.weeklyQueries)} />
          <StatCard
            label="Rolling Month"
            value={fmtNum(usage.monthlyQueries)}
          />
        </Section>

        <Section title="Inference Performance" icon={<Compass size={12} />}>
          <StatCard
            label="Retrieval Wall-Time"
            value={fmtMs(ai.avgRetrievalMs)}
            accent="blue"
          />
          <StatCard
            label="Generation Wall-Time"
            value={fmtMs(ai.avgGenerationMs)}
            accent="blue"
          />
          <StatCard
            label="End-to-End Latency"
            value={fmtMs(ai.avgEndToEndMs)}
            accent="blue"
          />
          <StatCard
            label="Avg Source Pool"
            value={ai.avgSourcesRetrieved}
            hint="candidates"
          />
          <StatCard
            label="Avg Source Match"
            value={ai.avgSourcesUsed}
            hint="injected"
          />
          <StatCard
            label="Est. Total Cost (30d)"
            value={fmtCost(ai.totalCostUsd)}
            accent="amber"
          />
        </Section>

        <Section
          title="Retrieval Pipeline Accuracy"
          icon={<ShieldAlert size={12} />}
        >
          <StatCard
            label="Verification Success"
            value={fmtPct(quality.verificationSuccessRate)}
            accent="emerald"
          />
          <StatCard
            label="Unsupported Boundary"
            value={fmtPct(quality.unsupportedRate)}
            accent={quality.unsupportedRate > 0.2 ? "red" : "emerald"}
          />
          <StatCard
            label="Citation Mapping"
            value={fmtPct(quality.citationCoverage)}
          />
          <StatCard
            label="Retrieval Hit Rate"
            value={fmtPct(quality.retrievalHitRate)}
          />
          <StatCard
            label="Avg Cross-Rerank Score"
            value={quality.avgRerankScore}
          />
          <StatCard
            label="Avg Generation Length"
            value={fmtNum(quality.avgAnswerLength)}
            hint="characters"
          />
        </Section>
      </div>

      {/* Analytics Data Trends Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Query Traversal Volume (14d)">
          <div className="pt-2">
            <LineChart
              data={series.map((p) => ({
                label: p.day.slice(5),
                value: p.queries,
              }))}
              stroke="#3b82f6"
            />
          </div>
        </Panel>
        <Panel title="Mean End-to-End Latency (14d)">
          <div className="pt-2">
            <LineChart
              data={series.map((p) => ({
                label: p.day.slice(5),
                value: p.avgLatencyMs,
              }))}
              stroke="#22d3ee"
              format={(n) => fmtMs(n)}
            />
          </div>
        </Panel>
        <Panel title="Deterministic Verification Success Rate (14d)">
          <div className="pt-2">
            <LineChart
              data={series.map((p) => ({
                label: p.day.slice(5),
                value: p.verificationRate,
              }))}
              stroke="#34d399"
              format={(n) => `${(n * 100).toFixed(0)}%`}
            />
          </div>
        </Panel>
        <Panel title="Context Citation Coverage (14d)">
          <div className="pt-2">
            <LineChart
              data={series.map((p) => ({
                label: p.day.slice(5),
                value: p.citationCoverage,
              }))}
              stroke="#a78bfa"
              format={(n) => `${(n * 100).toFixed(0)}%`}
            />
          </div>
        </Panel>
      </div>

      {/* Distribution Categorization */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Top Company Vectors">
          <div className="pt-1">
            <BarList
              data={financial.topCompanies.map((c) => ({
                label: c.name,
                value: c.count,
              }))}
            />
          </div>
        </Panel>
        <Panel title="High Frequency Knowledge Domains">
          <div className="pt-1">
            <BarList
              data={financial.topTopics.map((t) => ({
                label: t.name,
                value: t.count,
              }))}
              color="bg-indigo-500/80"
            />
          </div>
        </Panel>
        <Panel title={`Pipeline Operational Anomalies (${failures.total})`}>
          <div className="pt-1">
            {failures.byType.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-xs text-emerald-400 font-mono">
                No telemetry exceptions recorded. System nominal.
              </div>
            ) : (
              <BarList
                data={failures.byType.map((f) => ({
                  label: f.type,
                  value: f.count,
                }))}
                color="bg-rose-500/80"
              />
            )}
          </div>
        </Panel>
      </div>
    </DarkShell>
  );
}

function DarkShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen space-y-6 bg-slate-950 px-6 py-8 text-slate-300 md:px-10 antialiased">
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {icon}
        {title}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {children}
      </div>
    </div>
  );
}
