"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Activity, ArrowRight } from "lucide-react";
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
        setError("Failed to load observability metrics.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getToken]);

  if (loading) {
    return <DarkShell><p className="text-slate-500">Loading telemetry…</p></DarkShell>;
  }
  if (error || !summary) {
    return <DarkShell><p className="text-red-400">{error ?? "No data."}</p></DarkShell>;
  }

  const { usage, ai, quality, financial, failures } = summary;

  return (
    <DarkShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Activity size={20} className="text-blue-400" />
            RAG Observability
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Live telemetry from the retrieval pipeline · last 30 days
          </p>
        </div>
        <Link
          href="/admin/observability/traces"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-blue-500/50"
        >
          Query Traces <ArrowRight size={14} />
        </Link>
      </div>

      {/* Usage */}
      <Section title="Usage">
        <StatCard label="Total Queries" value={fmtNum(usage.totalQueries)} />
        <StatCard label="Total Chats" value={fmtNum(usage.totalChats)} />
        <StatCard label="Active Users" value={fmtNum(usage.activeUsers)} hint="30d" />
        <StatCard label="Today" value={fmtNum(usage.dailyQueries)} />
        <StatCard label="This Week" value={fmtNum(usage.weeklyQueries)} />
        <StatCard label="This Month" value={fmtNum(usage.monthlyQueries)} />
      </Section>

      {/* AI */}
      <Section title="AI Performance">
        <StatCard label="Retrieval Latency" value={fmtMs(ai.avgRetrievalMs)} accent="blue" />
        <StatCard label="Generation Latency" value={fmtMs(ai.avgGenerationMs)} accent="blue" />
        <StatCard label="End-to-End" value={fmtMs(ai.avgEndToEndMs)} accent="blue" />
        <StatCard label="Sources Retrieved" value={ai.avgSourcesRetrieved} hint="avg candidates" />
        <StatCard label="Sources Used" value={ai.avgSourcesUsed} hint="avg final" />
        <StatCard label="Est. Cost (30d)" value={fmtCost(ai.totalCostUsd)} accent="amber" />
      </Section>

      {/* Quality */}
      <Section title="Quality">
        <StatCard
          label="Verification Rate"
          value={fmtPct(quality.verificationSuccessRate)}
          accent="emerald"
        />
        <StatCard
          label="Unsupported Rate"
          value={fmtPct(quality.unsupportedRate)}
          accent={quality.unsupportedRate > 0.2 ? "red" : "emerald"}
        />
        <StatCard label="Citation Coverage" value={fmtPct(quality.citationCoverage)} />
        <StatCard label="Retrieval Hit Rate" value={fmtPct(quality.retrievalHitRate)} />
        <StatCard label="Avg Rerank Score" value={quality.avgRerankScore} />
        <StatCard label="Avg Answer Length" value={fmtNum(quality.avgAnswerLength)} hint="chars" />
      </Section>

      {/* Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Query Volume (14d)">
          <LineChart
            data={series.map((p) => ({ label: p.day.slice(5), value: p.queries }))}
            stroke="#3b82f6"
          />
        </Panel>
        <Panel title="End-to-End Latency (14d)">
          <LineChart
            data={series.map((p) => ({ label: p.day.slice(5), value: p.avgLatencyMs }))}
            stroke="#22d3ee"
            format={(n) => fmtMs(n)}
          />
        </Panel>
        <Panel title="Verification Rate (14d)">
          <LineChart
            data={series.map((p) => ({ label: p.day.slice(5), value: p.verificationRate }))}
            stroke="#34d399"
            format={(n) => `${(n * 100).toFixed(0)}%`}
          />
        </Panel>
        <Panel title="Citation Coverage (14d)">
          <LineChart
            data={series.map((p) => ({ label: p.day.slice(5), value: p.citationCoverage }))}
            stroke="#a78bfa"
            format={(n) => `${(n * 100).toFixed(0)}%`}
          />
        </Panel>
      </div>

      {/* Financial + failures */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Most Queried Companies">
          <BarList
            data={financial.topCompanies.map((c) => ({ label: c.name, value: c.count }))}
          />
        </Panel>
        <Panel title="Most Queried Topics">
          <BarList
            data={financial.topTopics.map((t) => ({ label: t.name, value: t.count }))}
            color="bg-violet-500"
          />
        </Panel>
        <Panel title={`Failures (${failures.total})`}>
          {failures.byType.length === 0 ? (
            <p className="py-6 text-center text-sm text-emerald-400">
              No failures recorded 🎉
            </p>
          ) : (
            <BarList
              data={failures.byType.map((f) => ({ label: f.type, value: f.count }))}
              color="bg-red-500"
            />
          )}
        </Panel>
      </div>
    </DarkShell>
  );
}

function DarkShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-10 -my-8 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-950 px-10 py-8 text-slate-300">
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {children}
      </div>
    </div>
  );
}
