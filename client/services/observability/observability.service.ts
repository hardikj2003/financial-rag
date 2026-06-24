import { authenticatedFetch } from "@/lib/authenticatedFetch";

export interface DashboardSummary {
  usage: {
    totalQueries: number;
    totalChats: number;
    totalMessages: number;
    activeUsers: number;
    dailyQueries: number;
    weeklyQueries: number;
    monthlyQueries: number;
  };
  ai: {
    avgRetrievalMs: number;
    avgGenerationMs: number;
    avgEndToEndMs: number;
    avgContextChars: number;
    avgPromptChars: number;
    avgSourcesRetrieved: number;
    avgSourcesUsed: number;
    avgInputTokens: number;
    avgOutputTokens: number;
    totalCostUsd: number;
  };
  quality: {
    verificationSuccessRate: number;
    unsupportedRate: number;
    citationCoverage: number;
    retrievalHitRate: number;
    avgRetrievalScore: number;
    avgRerankScore: number;
    avgAnswerLength: number;
  };
  financial: {
    topCompanies: { name: string; count: number }[];
    topTopics: { name: string; count: number }[];
  };
  failures: {
    total: number;
    byType: { type: string; count: number }[];
  };
}

export interface TimeseriesPoint {
  day: string;
  queries: number;
  avgLatencyMs: number;
  avgRerankScore: number;
  citationCoverage: number;
  verificationRate: number;
  costUsd: number;
}

export interface TraceListItem {
  id: string;
  originalQuery: string;
  queryType: string | null;
  companies: string[];
  totalMs: number | null;
  retrievalMs: number | null;
  generationMs: number | null;
  finalSourceCount: number | null;
  citedSourceCount: number | null;
  citationCoverage: number | null;
  verification: string | null;
  status: string;
  failureType: string | null;
  estCostUsd: number | null;
  createdAt: string;
}

export interface TraceListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: TraceListItem[];
}

export interface RetrievalResult {
  id: string;
  documentName: string;
  score: number;
  companyName?: string;
  sectionTitle?: string;
}

export interface TraceDetail extends TraceListItem {
  rewrittenQuery: string | null;
  generatedQueries: string[];
  verificationMs: number | null;
  isComparison: boolean;
  isAdvice: boolean;
  candidateCount: number | null;
  contextChars: number | null;
  promptChars: number | null;
  estInputTokens: number | null;
  estOutputTokens: number | null;
  avgRetrievalScore: number | null;
  avgRerankScore: number | null;
  answerLength: number | null;
  model: string | null;
  errorMessage: string | null;
  memoryCompany: string | null;
  memoryTopics: string[];
  retrievals: {
    id: string;
    retriever: string;
    searchQuery: string | null;
    company: string | null;
    resultCount: number;
    results: RetrievalResult[];
  }[];
  fusion: { beforeCount: number; afterCount: number; items: RetrievalResult[] } | null;
  rerank: {
    beforeCount: number;
    afterCount: number;
    items: (RetrievalResult & {
      beforeScore: number;
      afterScore: number;
      rank: number;
    })[];
  } | null;
  prompt: {
    systemPrompt: string;
    context: string;
    finalPrompt: string;
    chars: number;
    estTokens: number;
  } | null;
  llm: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latencyMs: number;
    streamMs: number;
    costUsd: number;
  } | null;
  verificationTrace: {
    verdict: string;
    citedSources: number;
    totalSources: number;
    evidence: { sourceId: number; documentName: string; cited: boolean }[];
  } | null;
  metricTrace: {
    companies: string[];
    topics: string[];
    metrics: string[];
  } | null;
}

export const getSummary = async (token: string) => {
  const api = await authenticatedFetch(token);
  const res = await api.get<{ summary: DashboardSummary }>(
    "/observability/summary",
  );
  return res.data.summary;
};

export const getTimeseries = async (token: string, days = 14) => {
  const api = await authenticatedFetch(token);
  const res = await api.get<{ series: TimeseriesPoint[] }>(
    `/observability/timeseries?days=${days}`,
  );
  return res.data.series;
};

export const getTraces = async (
  token: string,
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    verification?: string;
    queryType?: string;
  },
) => {
  const api = await authenticatedFetch(token);
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
  });
  const res = await api.get<TraceListResponse>(
    `/observability/traces?${qs.toString()}`,
  );
  return res.data;
};

export const getTraceDetail = async (token: string, id: string) => {
  const api = await authenticatedFetch(token);
  const res = await api.get<{ trace: TraceDetail }>(
    `/observability/traces/${id}`,
  );
  return res.data.trace;
};
