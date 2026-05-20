import { hybridSearch } from "./search/hybrid.search";
import { RetrievalMemory } from "./types/retrieval.types";

export const retrieveRelevantChunks = async (
  query: string,
  memory?: RetrievalMemory,
) => {
  const results = await hybridSearch(query, memory);
  return results;
};
