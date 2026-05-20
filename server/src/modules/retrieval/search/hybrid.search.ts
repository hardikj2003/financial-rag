import { vectorSearch } from "./vector.search";
import { keywordSearch } from "./keyword.search";
import { deduplicateChunks } from "../utils/deduplicate";
import { RetrievalMemory, RetrievedChunk } from "../types/retrieval.types";
import { rerankChunks } from "./reranker";
import { applyMetadataBoost } from "../utils/metadataBoost";
import { expandToParentContexts } from "../../../services/parentExpansion.service";

export const hybridSearch = async (
  query: string,
  memory?: RetrievalMemory,
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

  const metadataBoosted = applyMetadataBoost(query, deduplicated);
  let conversationalBoosted = metadataBoosted;

  if (memory) {
    conversationalBoosted = metadataBoosted.map((chunk) => {
      let score = chunk.score;
      const section = (chunk.sectionTitle || "").toLowerCase();

      for (const topic of memory.recentTopics) {
        if (section.includes(topic)) {
          score += 15;
        }
      }
      return {
        ...chunk,
        score,
      };
    });
  }

  const reranked = rerankChunks(query, conversationalBoosted);
  const expanded = expandToParentContexts(reranked);

  return expanded.slice(0, 4);
};
