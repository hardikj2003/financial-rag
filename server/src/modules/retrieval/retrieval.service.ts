import { hybridSearch } from "./search/hybrid.search";
import { generateSearchQueries } from "../../services/multiQuery.service";
import { deduplicateChunks } from "./utils/deduplicate";
import { rerankChunks } from "./search/reranker";
import { expandToParentContexts } from "../../services/parentExpansion.service";
import { QueryAnalysis } from "./utils/queryAnalyzer";
import { RetrievalMemory, RetrievedChunk } from "./types/retrieval.types";
import { logger } from "../../config/logger";
import { QueryTracer } from "../../services/tracing/queryTracer";

const FINAL_CHUNK_COUNT = 8;

/**
 * Retrieves a balanced set of chunks for ONE company. Tries a company-filtered
 * hybrid search first; if that returns nothing (e.g. documents ingested before
 * canonical company names existed), it falls back to an unfiltered search with
 * the company name injected into the query so retrieval still favours it.
 */
const retrieveForCompany = async (
  query: string,
  analysis: QueryAnalysis,
  memory: RetrievalMemory | undefined,
  company: string,
  limit: number,
  tracer?: QueryTracer,
): Promise<RetrievedChunk[]> => {
  const run = async (queries: string[], mem?: RetrievalMemory) => {
    const results = await Promise.all(
      queries.map((q) => hybridSearch(q, analysis, mem, tracer)),
    );
    return rerankChunks(query, deduplicateChunks(results.flat()));
  };

  // Filtered pass: bias the query toward the company AND filter in Qdrant.
  const filterMemory: RetrievalMemory = {
    recentTopics: memory?.recentTopics ?? [],
    currentCompany: company,
  };
  const filtered = await run([query, `${company} ${query}`], filterMemory);
  if (filtered.length > 0) {
    return filtered.slice(0, limit);
  }

  // Fallback: no hard filter, rely on company-biased queries + soft boosting.
  logger.warn("comparison: no filtered results, falling back to biased search", {
    company,
  });
  const biased = await run(
    [`${company} ${query}`, `${company} financial performance`],
    { recentTopics: memory?.recentTopics ?? [] },
  );
  return biased.slice(0, limit);
};

/** Round-robin merge so every company is represented near the top. */
const interleave = (lists: RetrievedChunk[][]): RetrievedChunk[] => {
  const merged: RetrievedChunk[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));

  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      if (list[i]) merged.push(list[i]);
    }
  }

  return merged;
};

/**
 * Comparison retrieval: run a separate, balanced retrieval per company so one
 * company (or a larger document) cannot monopolise all the context slots. The
 * previous single-company filter made multi-company comparison impossible.
 */
const retrieveForComparison = async (
  query: string,
  analysis: QueryAnalysis,
  memory?: RetrievalMemory,
  tracer?: QueryTracer,
): Promise<RetrievedChunk[]> => {
  const perCompany = Math.max(4, Math.ceil(FINAL_CHUNK_COUNT / analysis.companies.length));

  const perCompanyChunks = await Promise.all(
    analysis.companies.map((company) =>
      retrieveForCompany(query, analysis, memory, company, perCompany, tracer),
    ),
  );

  logger.debug("comparison retrieval", {
    companies: analysis.companies,
    counts: perCompanyChunks.map((c) => c.length),
  });

  const interleaved = interleave(perCompanyChunks);
  tracer?.recordRerank(perCompanyChunks.flat(), interleaved);
  return expandToParentContexts(interleaved);
};

/**
 * Full retrieval pipeline.
 *
 * - Comparison queries (2+ companies) retrieve per company and interleave.
 * - Multi-query expansion (extra LLM call + more searches) runs only for
 *   analytical questions; simple fact lookups search once.
 */
export const retrieveRelevantChunks = async (
  query: string,
  analysis: QueryAnalysis,
  memory?: RetrievalMemory,
  tracer?: QueryTracer,
): Promise<RetrievedChunk[]> => {
  if (analysis.type === "COMPARISON" && analysis.companies.length >= 2) {
    return retrieveForComparison(query, analysis, memory, tracer);
  }

  const searchQueries =
    analysis.type === "ANALYSIS"
      ? await generateSearchQueries(query, memory)
      : [query];

  if (searchQueries.length > 1) {
    tracer?.setAnalysis({ generatedQueries: searchQueries });
  }
  logger.debug("retrieval queries", { searchQueries });

  const searchResults = await Promise.all(
    searchQueries.map((q) => hybridSearch(q, analysis, memory, tracer)),
  );

  const deduplicated = deduplicateChunks(searchResults.flat());
  const reranked = rerankChunks(query, deduplicated);
  const top = reranked.slice(0, FINAL_CHUNK_COUNT);

  tracer?.recordRerank(deduplicated, top);
  return expandToParentContexts(top);
};
