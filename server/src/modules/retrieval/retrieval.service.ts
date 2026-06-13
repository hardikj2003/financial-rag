import { hybridSearch } from "./search/hybrid.search";
import { generateSearchQueries } from "../../services/multiQuery.service";
import { deduplicateChunks } from "./utils/deduplicate";
import { rerankChunks } from "./search/reranker";
import { expandToParentContexts } from "../../services/parentExpansion.service";
import { QueryAnalysis } from "./utils/queryAnalyzer";
import { RetrievalMemory, RetrievedChunk } from "./types/retrieval.types";
import { logger } from "../../config/logger";

const FINAL_CHUNK_COUNT = 8;

/**
 * Full retrieval pipeline:
 * (multi-)query → hybrid candidate generation per query → dedupe →
 * single final rerank → top-k → parent expansion.
 *
 * Multi-query expansion costs an extra LLM round-trip and multiplies search
 * load, so it only runs for analytical/comparative questions where recall
 * matters more than latency. Simple fact lookups search once.
 */
export const retrieveRelevantChunks = async (
  query: string,
  analysis: QueryAnalysis,
  memory?: RetrievalMemory,
): Promise<RetrievedChunk[]> => {
  const useMultiQuery =
    analysis.type === "COMPARISON" || analysis.type === "ANALYSIS";

  const searchQueries = useMultiQuery
    ? await generateSearchQueries(query, memory)
    : [query];

  logger.debug("retrieval queries", { searchQueries });

  const searchResults = await Promise.all(
    searchQueries.map((q) => hybridSearch(q, analysis, memory)),
  );

  const deduplicated = deduplicateChunks(searchResults.flat());
  const reranked = rerankChunks(query, deduplicated);
  const top = reranked.slice(0, FINAL_CHUNK_COUNT);

  return expandToParentContexts(top);
};
