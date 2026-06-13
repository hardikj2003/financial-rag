import { RetrievedChunk } from "../types/retrieval.types";

/**
 * Reciprocal Rank Fusion. Only the *rank* inside each list matters, which is
 * what makes fusing rankers with incomparable score scales (cosine similarity
 * vs term frequency) valid. The fused RRF score becomes the chunk's canonical
 * score for the rest of the pipeline — downstream boosts must scale it,
 * never replace it.
 */
export const reciprocalRankFusion = (
  rankings: RetrievedChunk[][],
  k = 60,
): RetrievedChunk[] => {
  const fused = new Map<string, RetrievedChunk>();

  for (const ranking of rankings) {
    ranking.forEach((chunk, rank) => {
      const contribution = 1 / (k + rank + 1);
      const existing = fused.get(chunk.id);

      if (existing) {
        existing.score += contribution;
      } else {
        fused.set(chunk.id, { ...chunk, score: contribution });
      }
    });
  }

  return Array.from(fused.values()).sort((a, b) => b.score - a.score);
};
