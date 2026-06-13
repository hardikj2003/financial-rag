import { RetrievedChunk, RetrievalMemory } from "../types/retrieval.types";
import { QueryAnalysis } from "./queryAnalyzer";

const PRIORITY_SECTIONS = new Set([
  "management discussion",
  "financial highlights",
  "results of operations",
]);

/**
 * Multiplicative boosts on top of the fused RRF score. Multiplicative (not
 * additive) so the boost is scale-independent: a previous version added raw
 * points (+25, +20) to scores from incomparable scales, which let hardcoded
 * source scores dominate the ranking entirely.
 */
export const applyMetadataBoost = (
  analysis: QueryAnalysis,
  chunks: RetrievedChunk[],
  memory?: RetrievalMemory,
): RetrievedChunk[] => {
  return chunks
    .map((chunk) => {
      let multiplier = 1;
      const section = (chunk.sectionTitle || "").toLowerCase();

      if (analysis.preferredSections.some((p) => section.includes(p))) {
        multiplier *= 1.3;
      }

      if (PRIORITY_SECTIONS.has(section)) {
        multiplier *= 1.1;
      }

      if (
        memory?.currentCompany &&
        chunk.companyName === memory.currentCompany
      ) {
        multiplier *= 1.25;
      }

      if (
        memory?.recentTopics?.some((topic) =>
          section.includes(topic.toLowerCase()),
        )
      ) {
        multiplier *= 1.15;
      }

      return { ...chunk, score: chunk.score * multiplier };
    })
    .sort((a, b) => b.score - a.score);
};
