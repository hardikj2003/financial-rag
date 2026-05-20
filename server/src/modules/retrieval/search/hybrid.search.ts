import { vectorSearch } from "./vector.search";
import { keywordSearch } from "./keyword.search";
import { deduplicateChunks } from "../utils/deduplicate";
import { RetrievedChunk } from "../types/retrieval.types";
import { rerankChunks } from "./reranker";
import { applyMetadataBoost } from "../utils/metadataBoost";
import { expandToParentContexts } from "../../../services/parentExpansion.service";

export const hybridSearch = async (
  query: string,
): Promise<RetrievedChunk[]> => {
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query),
    keywordSearch(query),
  ]);

  // Boost vector scores
  const normalizedVector = vectorResults.map((chunk) => ({
    ...chunk,
    score: chunk.score * 10,
  }));

  // Boost keyword scores
  const normalizedKeyword = keywordResults.map((chunk) => ({
    ...chunk,
    score: chunk.score * 3,
  }));

  const merged = [...normalizedVector, ...normalizedKeyword];
  const deduplicated = deduplicateChunks(merged);

  const metadataBoosted = applyMetadataBoost(deduplicated);

  const reranked = rerankChunks(query, metadataBoosted);
  const expanded = expandToParentContexts(reranked);

  return expanded.slice(0, 4);
};
