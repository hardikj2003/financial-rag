import { hybridSearch } from "./search/hybrid.search";
import { rewriteQuery } from "../../services/queryRewrite.service";
import { generateSearchQueries } from "../../services/multiQuery.service";
import { deduplicateChunks } from "./utils/deduplicate";
import { rerankChunks } from "./search/reranker";
import { RetrievalMemory } from "./types/retrieval.types";

export const retrieveRelevantChunks = async (
  query: string,
  memory?: RetrievalMemory,
) => {
  const rewrittenQuery =
    process.env.ENABLE_QUERY_REWRITE === "true"
      ? await rewriteQuery(query, memory)
      : query;
  const finalQuery = rewrittenQuery?.trim() || query;
  const searchQueries = await generateSearchQueries(finalQuery, memory);
  console.log("MULTI QUERY SEARCH:", searchQueries);
  const searchResults = await Promise.all(
    searchQueries.map((q) => hybridSearch(q, memory)),
  );
  const merged = searchResults.flat();
  const deduplicated = deduplicateChunks(merged);
  // One final rerank across ALL retrieved chunks
  const reranked = rerankChunks(finalQuery, deduplicated);
  return reranked.slice(0, 8);
};
