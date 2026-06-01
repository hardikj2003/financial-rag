import type { Metadata } from "next";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Database,
  FileSearch,
  GitBranch,
  Layers3,
  LineChart,
  Lock,
  Network,
  Quote,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Table2,
  Users,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Financial RAG Portfolio",
  description:
    "A professional portfolio case study for a production-grade Financial RAG platform.",
};

const coreMetrics = [
  { label: "Retrieval layers", value: "9", detail: "hybrid, graph, agentic" },
  { label: "Evidence traceability", value: "100%", detail: "chunk-level citations" },
  { label: "Latency strategy", value: "Redis", detail: "cached retrieval paths" },
  { label: "Deployment posture", value: "SaaS", detail: "multi-tenant ready" },
];

const shippedCapabilities = [
  {
    title: "Context Compression",
    description:
      "Compresses retrieved evidence before generation while preserving financial figures, percentages, monetary values, and query-relevant statements.",
    icon: Layers3,
  },
  {
    title: "Answer Verification",
    description:
      "Checks generated answers against retrieved evidence to reduce unsupported claims and keep financial analysis grounded.",
    icon: ShieldCheck,
  },
  {
    title: "Hybrid Knowledge Generation",
    description:
      "Separates document-derived facts from broader financial interpretation so users can distinguish evidence from analysis.",
    icon: BrainCircuit,
  },
  {
    title: "Citation-Level Grounding",
    description:
      "Adds inline citations tied to retrieved chunks, making every important statement traceable back to source evidence.",
    icon: Quote,
  },
  {
    title: "Company-Aware Retrieval",
    description:
      "Detects companies during ingestion and retrieval, then uses conversational memory for precise company-specific follow-ups.",
    icon: Building2,
  },
  {
    title: "Table Extraction Pipeline",
    description:
      "Extracts statements, financial tables, balance sheets, cash-flow data, and structured numerical records for accurate reasoning.",
    icon: Table2,
  },
  {
    title: "Evaluation Framework",
    description:
      "Runs retrieval metrics, answer-quality scoring, hallucination detection, regression checks, and benchmark datasets.",
    icon: BadgeCheck,
  },
  {
    title: "Retrieval Cache",
    description:
      "Uses Redis caching for repeated retrieval and generation paths to reduce latency, cost, and redundant computation.",
    icon: Zap,
  },
  {
    title: "Agentic Retrieval",
    description:
      "Plans multi-step retrieval workflows for comparisons, trend analysis, and multi-company financial research.",
    icon: GitBranch,
  },
  {
    title: "Knowledge Graph Layer",
    description:
      "Builds relationships across companies, metrics, risks, investments, segments, and filings for graph-enhanced retrieval.",
    icon: Network,
  },
  {
    title: "Observability & Monitoring",
    description:
      "Tracks retrieval latency, generation latency, retrieval quality, cache hit rate, failures, and user activity.",
    icon: Activity,
  },
  {
    title: "SaaS & Production Hardening",
    description:
      "Includes workspaces, billing, quotas, API access, admin controls, rate limits, queues, CI/CD, backups, and recovery workflows.",
    icon: ServerCog,
  },
];

const architecture = [
  "Authenticated workspace",
  "PDF ingestion",
  "Smart chunking",
  "Embedding generation",
  "Qdrant vector index",
  "Keyword retrieval",
  "Reranking",
  "Parent expansion",
  "Context compression",
  "Verified LLM answer",
];

const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Zustand",
  "Express",
  "Prisma",
  "PostgreSQL",
  "Qdrant",
  "Redis",
  "Groq",
  "Xenova Transformers",
];

export default function PortfolioPage() {
  return (
    <main className="h-screen overflow-y-auto bg-[#f7f4ee] text-[#171513]">
      <section className="relative min-h-[92vh] overflow-hidden border-b border-[#d8d0c4] bg-[#f7f4ee]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,21,19,0.07)_1px,transparent_1px),linear-gradient(0deg,rgba(23,21,19,0.07)_1px,transparent_1px)] bg-size-[44px_44px]" />
        <div className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 border border-[#cfc6b8] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6257]">
              <Sparkles className="h-4 w-4 text-[#0f766e]" />
              Production-grade AI finance research
            </div>
            <h1 className="text-5xl font-semibold leading-[1.02] text-[#171513] sm:text-6xl lg:text-7xl">
              Financial RAG Platform
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f574f]">
              A full-stack research assistant for financial PDFs that ingests
              filings, understands tables and company context, retrieves across
              vector, keyword, cache, and graph layers, then produces verified
              answers with citations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#case-study"
                className="inline-flex items-center gap-2 bg-[#171513] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#38322d]"
              >
                View case study
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="#architecture"
                className="inline-flex items-center gap-2 border border-[#bdb3a4] bg-white/70 px-5 py-3 text-sm font-semibold text-[#171513] transition hover:bg-white"
              >
                Architecture
                <Database className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="border border-[#bdb3a4] bg-[#171513] p-4 shadow-2xl shadow-[#76604f]/20">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-white">
                <div>
                  <p className="text-sm font-semibold">Research Console</p>
                  <p className="text-xs text-white/50">AAPL 10-K analysis</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  verified
                </div>
              </div>
              <div className="grid gap-4 pt-4 md:grid-cols-[1fr_0.72fr]">
                <div className="space-y-4">
                  <div className="bg-white p-4 text-[#171513]">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c7065]">
                      <FileSearch className="h-4 w-4 text-[#0f766e]" />
                      Question
                    </div>
                    <p className="text-lg font-semibold">
                      What drove margin expansion and how did cash flow change?
                    </p>
                  </div>
                  <div className="space-y-3 bg-[#f7f4ee] p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-[#0f766e]" />
                      <p className="text-sm leading-6 text-[#413b36]">
                        Gross margin expanded due to product mix and lower
                        component costs, with operating cash flow improving
                        alongside working-capital discipline.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                      <span className="bg-white px-2 py-3 text-[#0f766e]">
                        cite 4.2
                      </span>
                      <span className="bg-white px-2 py-3 text-[#a15c13]">
                        table 9
                      </span>
                      <span className="bg-white px-2 py-3 text-[#4f46e5]">
                        verified
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {coreMetrics.map((metric) => (
                    <div key={metric.label} className="bg-white/8 p-4 text-white">
                      <p className="text-2xl font-semibold">{metric.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-sm text-white/72">{metric.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-12 items-end gap-2 border-t border-white/10 pt-4">
                {[34, 58, 42, 72, 66, 90, 54, 82, 76, 96, 70, 88].map(
                  (height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className="bg-[#0f766e]"
                      style={{ height: `${height}px` }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="case-study" className="border-b border-[#d8d0c4] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a1d]">
                What I built
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                A defensible research workflow for finance teams.
              </h2>
              <p className="mt-4 leading-7 text-[#625a52]">
                The platform moves beyond simple PDF chat by combining
                retrieval quality, evidence compression, verification, table
                awareness, and operational readiness into one research system.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shippedCapabilities.map((capability) => {
                const Icon = capability.icon;

                return (
                  <article
                    key={capability.title}
                    className="border border-[#ded7cc] bg-[#fbfaf7] p-5"
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center bg-[#171513] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold">{capability.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#625a52]">
                      {capability.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="bg-[#eee8de]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <LineChart className="h-6 w-6 text-[#0f766e]" />
                <h2 className="text-3xl font-semibold">Retrieval Architecture</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {architecture.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 border border-[#d4cabc] bg-white px-4 py-3"
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center bg-[#0f766e] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside className="border border-[#d4cabc] bg-[#171513] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
                    Stack
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Full-stack TypeScript
                  </h3>
                </div>
                <BarChart3 className="h-8 w-8 text-[#7dd3fc]" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {stack.map((item) => (
                  <span
                    key={item}
                    className="border border-white/15 bg-white/8 px-3 py-2 text-sm text-white/85"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 grid gap-3">
                {[
                  ["Security", "Clerk auth, admin controls, rate limiting"],
                  ["Data", "PostgreSQL records, Qdrant vectors, Redis cache"],
                  ["Quality", "Regression evals, monitoring, verification"],
                  ["SaaS", "Workspaces, quotas, billing, API access"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[110px_1fr] gap-3 border-t border-white/10 pt-3 text-sm"
                  >
                    <span className="font-semibold text-white">{label}</span>
                    <span className="text-white/65">{value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-3 lg:px-10">
          {[
            {
              title: "For analysts",
              body: "Compare filings, trace every claim, inspect cited evidence, and move from question to sourced conclusion faster.",
              icon: Users,
            },
            {
              title: "For operators",
              body: "Monitor latency, failures, retrieval quality, usage, cache hit rate, and cost behavior across teams.",
              icon: Activity,
            },
            {
              title: "For enterprises",
              body: "Run secure workspaces with quotas, API access, admin controls, CI/CD, backups, and disaster recovery.",
              icon: Lock,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="border-t border-[#d8d0c4] pt-5">
                <Icon className="h-7 w-7 text-[#0f766e]" />
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-[#625a52]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
