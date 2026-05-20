import { RetrievedChunk } from "../types/retrieval.types";

import { queryMetadataRouter } from "./queryMetadataRouter";

export const applyMetadataBoost = (
  query: string,
  chunks: RetrievedChunk[],
): RetrievedChunk[] => {
  const { preferredSections } = queryMetadataRouter(query);

  return chunks.map((chunk) => {
    let boostedScore = chunk.score;
    const section = (chunk.sectionTitle || "").toLowerCase();

    // Section Matching Boost
    for (const preferred of preferredSections) {
      if (section.includes(preferred)) {
        boostedScore += 25;
      }
    }
    // Financial Priority Boost
    if (
      [
        "management discussion",
        "financial highlights",
        "results of operations",
      ].includes(section)
    ) {
      boostedScore += 8;
    }


    return {
      ...chunk,
      score: boostedScore,
    };
  });
};
