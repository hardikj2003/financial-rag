import prisma from "../../config/prisma";
import { logger } from "../../config/logger";
import { RetrievedChunk } from "../../modules/retrieval/types/retrieval.types";

/**
 * Accumulates everything that happens during one chat request and persists it
 * as a single QueryTrace (+ child stage traces) at the end. All capture methods
 * are failure-isolated: instrumentation must never break a chat.
 *
 * ~4 chars per token is the standard rough estimate for English text and is
 * good enough for budgeting/visualization (we don't have the model tokenizer).
 */
const CHARS_PER_TOKEN = 4;
export const estimateTokens = (text: string) =>
  Math.ceil((text?.length ?? 0) / CHARS_PER_TOKEN);

// Estimated Groq pricing (USD per token). Override via env; defaults are
// public list prices for llama-3.3-70b and clearly labelled "estimated".
const INPUT_COST = Number(process.env.GROQ_INPUT_COST_PER_TOKEN ?? 0.00000059);
const OUTPUT_COST = Number(process.env.GROQ_OUTPUT_COST_PER_TOKEN ?? 0.00000079);

interface RetrieverRecord {
  retriever: string;
  searchQuery?: string;
  company?: string;
  results: Array<Record<string, unknown>>;
}

const slimChunk = (c: RetrievedChunk) => ({
  id: c.id,
  documentName: c.documentName,
  score: Number(c.score?.toFixed?.(4) ?? c.score ?? 0),
  companyName: c.companyName,
  sectionTitle: c.sectionTitle,
});

const average = (nums: number[]) =>
  nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;

export class QueryTracer {
  private readonly start = Date.now();
  private retrievalMs?: number;
  private generationMs?: number;
  private verificationMs?: number;
  private streamMs?: number;

  private readonly retrievers: RetrieverRecord[] = [];
  private fusion?: { beforeCount: number; afterCount: number; items: unknown[] };
  private rerank?: { beforeCount: number; afterCount: number; items: unknown[] };
  private prompt?: { system: string; context: string; final: string };
  private llm?: { model: string; inputTokens: number; outputTokens: number };
  private verification?: {
    verdict: string;
    citedSources: number;
    totalSources: number;
    evidence: unknown[];
  };

  private finalSources: RetrievedChunk[] = [];

  constructor(
    private readonly meta: {
      chatId?: string;
      userId?: string;
      originalQuery: string;
    },
  ) {}

  private rewrittenQuery?: string;
  private generatedQueries: string[] = [];
  private queryType?: string;
  private companies: string[] = [];
  private topics: string[] = [];
  private isComparison = false;
  private isAdvice = false;
  private memoryCompany?: string;
  private status: "ok" | "error" | "rate_limited" = "ok";
  private failureType = "none";
  private errorMessage?: string;

  setAnalysis(a: {
    rewrittenQuery?: string;
    generatedQueries?: string[];
    queryType?: string;
    companies?: string[];
    isComparison?: boolean;
    isAdvice?: boolean;
  }) {
    this.rewrittenQuery = a.rewrittenQuery;
    if (a.generatedQueries) this.generatedQueries = a.generatedQueries;
    this.queryType = a.queryType;
    if (a.companies) this.companies = a.companies;
    if (typeof a.isComparison === "boolean") this.isComparison = a.isComparison;
    if (typeof a.isAdvice === "boolean") this.isAdvice = a.isAdvice;
  }

  setMemory(company: string | undefined, topics: string[]) {
    this.memoryCompany = company;
    this.topics = topics;
  }

  recordRetriever(rec: {
    retriever: string;
    searchQuery?: string;
    company?: string;
    results: RetrievedChunk[];
  }) {
    this.retrievers.push({
      retriever: rec.retriever,
      searchQuery: rec.searchQuery,
      company: rec.company,
      results: rec.results.map(slimChunk),
    });
  }

  recordFusion(before: RetrievedChunk[], after: RetrievedChunk[]) {
    this.fusion = {
      beforeCount: before.length,
      afterCount: after.length,
      items: after.slice(0, 30).map(slimChunk),
    };
  }

  recordRerank(before: RetrievedChunk[], after: RetrievedChunk[]) {
    const beforeById = new Map(before.map((c) => [c.id, c.score]));
    this.rerank = {
      beforeCount: before.length,
      afterCount: after.length,
      items: after.slice(0, 30).map((c, idx) => {
        const beforeScore = beforeById.get(c.id) ?? 0;
        return {
          ...slimChunk(c),
          beforeScore: Number((beforeScore as number)?.toFixed?.(4) ?? 0),
          afterScore: Number(c.score?.toFixed?.(4) ?? 0),
          rank: idx + 1,
        };
      }),
    };
  }

  setRetrievalMs(ms: number) {
    this.retrievalMs = ms;
  }

  recordPrompt(system: string, context: string, final: string) {
    this.prompt = { system, context, final };
  }

  setFinalSources(sources: RetrievedChunk[]) {
    this.finalSources = sources;
  }

  recordGeneration(model: string, outputText: string, ms: number, streamMs: number) {
    this.generationMs = ms;
    this.streamMs = streamMs;
    this.llm = {
      model,
      inputTokens: estimateTokens(this.prompt?.final ?? ""),
      outputTokens: estimateTokens(outputText),
    };
  }

  recordVerification(verdict: string, answer: string, ms: number) {
    this.verificationMs = ms;
    const cited = this.citedSourceIds(answer);
    this.verification = {
      verdict,
      citedSources: cited.size,
      totalSources: this.finalSources.length,
      evidence: this.finalSources.map((s, i) => ({
        sourceId: i + 1,
        documentName: s.documentName,
        cited: cited.has(i + 1),
      })),
    };
  }

  setError(status: "error" | "rate_limited", failureType: string, message?: string) {
    this.status = status;
    this.failureType = failureType;
    this.errorMessage = message;
  }

  setFailureType(failureType: string) {
    if (this.failureType === "none") this.failureType = failureType;
  }

  /** Parses [Source N] citations out of the answer. */
  private citedSourceIds(answer: string): Set<number> {
    const ids = new Set<number>();
    const re = /\[\s*source\s*(\d+)\s*\]/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(answer)) !== null) ids.add(Number(m[1]));
    return ids;
  }

  private outputText = "";
  setOutputText(text: string) {
    this.outputText = text;
  }

  /** Persists the full trace. Fire-and-forget; never throws into the request. */
  async persist() {
    try {
      const finalScores = this.finalSources
        .map((s) => Number(s.score))
        .filter((n) => Number.isFinite(n));
      const candidateCount = this.fusion?.beforeCount ?? this.rerank?.beforeCount;
      const contextChars = this.prompt?.context.length;
      const promptChars = this.prompt?.final.length;
      const estInputTokens = this.prompt
        ? estimateTokens(this.prompt.final)
        : undefined;
      const estOutputTokens = estimateTokens(this.outputText);
      const estCostUsd =
        estInputTokens !== undefined
          ? estInputTokens * INPUT_COST + estOutputTokens * OUTPUT_COST
          : undefined;
      const citationCoverage = this.verification
        ? this.verification.totalSources
          ? this.verification.citedSources / this.verification.totalSources
          : 0
        : undefined;

      if (this.finalSources.length === 0 && this.failureType === "none") {
        this.failureType = "empty_context";
      }

      await prisma.queryTrace.create({
        data: {
          chatId: this.meta.chatId,
          userId: this.meta.userId,
          originalQuery: this.meta.originalQuery,
          rewrittenQuery: this.rewrittenQuery,
          generatedQueries: this.generatedQueries,
          queryType: this.queryType,
          companies: this.companies,
          isComparison: this.isComparison,
          isAdvice: this.isAdvice,

          totalMs: Date.now() - this.start,
          retrievalMs: this.retrievalMs,
          generationMs: this.generationMs,
          verificationMs: this.verificationMs,

          candidateCount,
          finalSourceCount: this.finalSources.length,
          citedSourceCount: this.verification?.citedSources,
          contextChars,
          promptChars,
          estInputTokens,
          estOutputTokens,
          estCostUsd,

          avgRetrievalScore: average(
            (this.fusion?.items as Array<{ score?: number }> | undefined)?.map(
              (i) => i.score ?? 0,
            ) ?? [],
          ),
          avgRerankScore: average(finalScores),
          citationCoverage,
          verification: this.verification?.verdict,
          answerLength: this.outputText.length,

          status: this.status,
          failureType: this.failureType,
          errorMessage: this.errorMessage,
          model: this.llm?.model,

          memoryCompany: this.memoryCompany,
          memoryTopics: this.topics,

          retrievals: {
            create: this.retrievers.map((r) => ({
              retriever: r.retriever,
              searchQuery: r.searchQuery,
              company: r.company,
              resultCount: r.results.length,
              results: r.results as object,
            })),
          },
          fusion: this.fusion
            ? {
                create: {
                  beforeCount: this.fusion.beforeCount,
                  afterCount: this.fusion.afterCount,
                  items: this.fusion.items as object,
                },
              }
            : undefined,
          rerank: this.rerank
            ? {
                create: {
                  beforeCount: this.rerank.beforeCount,
                  afterCount: this.rerank.afterCount,
                  items: this.rerank.items as object,
                },
              }
            : undefined,
          prompt: this.prompt
            ? {
                create: {
                  systemPrompt: this.prompt.system,
                  context: this.prompt.context,
                  finalPrompt: this.prompt.final,
                  chars: this.prompt.final.length,
                  estTokens: estimateTokens(this.prompt.final),
                },
              }
            : undefined,
          llm: this.llm
            ? {
                create: {
                  model: this.llm.model,
                  inputTokens: this.llm.inputTokens,
                  outputTokens: this.llm.outputTokens,
                  totalTokens: this.llm.inputTokens + this.llm.outputTokens,
                  latencyMs: this.generationMs ?? 0,
                  streamMs: this.streamMs ?? 0,
                  costUsd:
                    this.llm.inputTokens * INPUT_COST +
                    this.llm.outputTokens * OUTPUT_COST,
                },
              }
            : undefined,
          verificationTrace: this.verification
            ? {
                create: {
                  verdict: this.verification.verdict,
                  citedSources: this.verification.citedSources,
                  totalSources: this.verification.totalSources,
                  evidence: this.verification.evidence as object,
                },
              }
            : undefined,
          metricTrace: {
            create: {
              companies: this.companies,
              topics: this.topics,
              metrics: [],
            },
          },
        },
      });
    } catch (error) {
      logger.error("failed to persist query trace", error);
    }
  }
}
