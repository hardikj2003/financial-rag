import prisma from "../../config/prisma";

const sinceDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const avg = (nums: Array<number | null | undefined>) => {
  const valid = nums.filter((n): n is number => typeof n === "number");
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
};

const rate = (numerator: number, denominator: number) =>
  denominator ? numerator / denominator : 0;

/** Top-level dashboard metrics (usage, AI, quality, financial). */
export const getDashboardSummary = async () => {
  const since30 = sinceDate(30);

  const [
    totalTraces,
    totalChats,
    totalMessages,
    daily,
    weekly,
    monthly,
    activeUserRows,
    traces,
  ] = await Promise.all([
    prisma.queryTrace.count(),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.queryTrace.count({ where: { createdAt: { gte: sinceDate(1) } } }),
    prisma.queryTrace.count({ where: { createdAt: { gte: sinceDate(7) } } }),
    prisma.queryTrace.count({ where: { createdAt: { gte: sinceDate(30) } } }),
    prisma.queryTrace.findMany({
      where: { createdAt: { gte: since30 }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.queryTrace.findMany({
      where: { createdAt: { gte: since30 } },
      select: {
        retrievalMs: true,
        generationMs: true,
        totalMs: true,
        contextChars: true,
        promptChars: true,
        candidateCount: true,
        finalSourceCount: true,
        citedSourceCount: true,
        citationCoverage: true,
        avgRetrievalScore: true,
        avgRerankScore: true,
        answerLength: true,
        estInputTokens: true,
        estOutputTokens: true,
        estCostUsd: true,
        verification: true,
        status: true,
        failureType: true,
        companies: true,
        memoryTopics: true,
      },
    }),
  ]);

  const verified = traces.filter((t) => t.verification === "SUPPORTED").length;
  const unsupported = traces.filter(
    (t) => t.verification === "UNSUPPORTED",
  ).length;
  const withVerdict = verified + unsupported;
  const withResults = traces.filter((t) => (t.finalSourceCount ?? 0) > 0).length;

  // Financial leaderboards.
  const tally = (lists: string[][]) => {
    const counts = new Map<string, number>();
    for (const list of lists)
      for (const item of list)
        counts.set(item, (counts.get(item) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  return {
    usage: {
      totalQueries: totalTraces,
      totalChats,
      totalMessages,
      activeUsers: activeUserRows.length,
      dailyQueries: daily,
      weeklyQueries: weekly,
      monthlyQueries: monthly,
    },
    ai: {
      avgRetrievalMs: Math.round(avg(traces.map((t) => t.retrievalMs))),
      avgGenerationMs: Math.round(avg(traces.map((t) => t.generationMs))),
      avgEndToEndMs: Math.round(avg(traces.map((t) => t.totalMs))),
      avgContextChars: Math.round(avg(traces.map((t) => t.contextChars))),
      avgPromptChars: Math.round(avg(traces.map((t) => t.promptChars))),
      avgSourcesRetrieved: Number(avg(traces.map((t) => t.candidateCount)).toFixed(1)),
      avgSourcesUsed: Number(avg(traces.map((t) => t.finalSourceCount)).toFixed(1)),
      avgInputTokens: Math.round(avg(traces.map((t) => t.estInputTokens))),
      avgOutputTokens: Math.round(avg(traces.map((t) => t.estOutputTokens))),
      totalCostUsd: Number(
        traces.reduce((a, t) => a + (t.estCostUsd ?? 0), 0).toFixed(4),
      ),
    },
    quality: {
      verificationSuccessRate: rate(verified, withVerdict),
      unsupportedRate: rate(unsupported, withVerdict),
      citationCoverage: avg(traces.map((t) => t.citationCoverage)),
      retrievalHitRate: rate(withResults, traces.length),
      avgRetrievalScore: Number(avg(traces.map((t) => t.avgRetrievalScore)).toFixed(3)),
      avgRerankScore: Number(avg(traces.map((t) => t.avgRerankScore)).toFixed(1)),
      avgAnswerLength: Math.round(avg(traces.map((t) => t.answerLength))),
    },
    financial: {
      topCompanies: tally(traces.map((t) => t.companies)),
      topTopics: tally(traces.map((t) => t.memoryTopics)),
    },
    failures: {
      total: traces.filter((t) => t.status !== "ok").length,
      byType: Object.entries(
        traces.reduce<Record<string, number>>((acc, t) => {
          const type = t.failureType && t.failureType !== "none" ? t.failureType : null;
          if (type) acc[type] = (acc[type] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([type, count]) => ({ type, count })),
    },
  };
};

/** Daily time series for the trend charts. */
export const getTimeseries = async (days = 14) => {
  const traces = await prisma.queryTrace.findMany({
    where: { createdAt: { gte: sinceDate(days) } },
    select: {
      createdAt: true,
      totalMs: true,
      avgRerankScore: true,
      citationCoverage: true,
      verification: true,
      estCostUsd: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const buckets = new Map<
    string,
    { count: number; totalMs: number[]; rerank: number[]; coverage: number[]; supported: number; verdicts: number; cost: number }
  >();

  for (const t of traces) {
    const day = t.createdAt.toISOString().slice(0, 10);
    const b =
      buckets.get(day) ??
      { count: 0, totalMs: [], rerank: [], coverage: [], supported: 0, verdicts: 0, cost: 0 };
    b.count++;
    if (typeof t.totalMs === "number") b.totalMs.push(t.totalMs);
    if (typeof t.avgRerankScore === "number") b.rerank.push(t.avgRerankScore);
    if (typeof t.citationCoverage === "number") b.coverage.push(t.citationCoverage);
    if (t.verification === "SUPPORTED" || t.verification === "UNSUPPORTED") {
      b.verdicts++;
      if (t.verification === "SUPPORTED") b.supported++;
    }
    b.cost += t.estCostUsd ?? 0;
    buckets.set(day, b);
  }

  return Array.from(buckets.entries()).map(([day, b]) => ({
    day,
    queries: b.count,
    avgLatencyMs: Math.round(avg(b.totalMs)),
    avgRerankScore: Number(avg(b.rerank).toFixed(1)),
    citationCoverage: Number(avg(b.coverage).toFixed(2)),
    verificationRate: b.verdicts ? Number((b.supported / b.verdicts).toFixed(2)) : 0,
    costUsd: Number(b.cost.toFixed(4)),
  }));
};

interface TraceFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  verification?: string;
  queryType?: string;
}

/** Paginated, filterable trace list. */
export const listTraces = async (filters: TraceFilters) => {
  const where: Record<string, unknown> = {};
  if (filters.search)
    where.originalQuery = { contains: filters.search, mode: "insensitive" };
  if (filters.status && filters.status !== "all") where.status = filters.status;
  if (filters.verification && filters.verification !== "all")
    where.verification = filters.verification;
  if (filters.queryType && filters.queryType !== "all")
    where.queryType = filters.queryType;

  const [total, items] = await Promise.all([
    prisma.queryTrace.count({ where }),
    prisma.queryTrace.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: {
        id: true,
        originalQuery: true,
        queryType: true,
        companies: true,
        totalMs: true,
        retrievalMs: true,
        generationMs: true,
        finalSourceCount: true,
        citedSourceCount: true,
        citationCoverage: true,
        verification: true,
        status: true,
        failureType: true,
        estCostUsd: true,
        createdAt: true,
      },
    }),
  ]);

  return { total, page: filters.page, pageSize: filters.pageSize, items };
};

/** Full trace with every child stage, for end-to-end replay. */
export const getTraceById = async (id: string) => {
  return prisma.queryTrace.findUnique({
    where: { id },
    include: {
      retrievals: { orderBy: { createdAt: "asc" } },
      fusion: true,
      rerank: true,
      prompt: true,
      llm: true,
      verificationTrace: true,
      metricTrace: true,
    },
  });
};
