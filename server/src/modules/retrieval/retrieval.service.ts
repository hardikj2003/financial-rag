import { hybridSearch } from "./search/hybrid.search";

export const retrieveRelevantChunks = async (query: string) => {
  const results = await hybridSearch(query);

  console.log(
    "FINAL METADATA-RERANKED RESULTS:",
    results.map((r) => ({
      score: r.score,
      section: r.sectionTitle,
      preview: r.text.slice(0, 80),
    })),
  );
  return results;
};
