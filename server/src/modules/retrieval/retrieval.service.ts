import { hybridSearch } from "./search/hybrid.search";

export const retrieveRelevantChunks = async (query: string) => {
  const results = await hybridSearch(query);

  console.log(
    "HYBRID RESULTS:",
    results.map((r) => ({
      score: r.score,

      chunk: r.text.slice(0, 80),
    })),
  );

  return results;
};
