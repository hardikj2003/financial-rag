import { RetrievedChunk } from "../types/retrieval.types";

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 2);

/**
 * Final heuristic rerank, applied exactly once at the end of the pipeline.
 *
 * Blends the fused retrieval score (normalized to 0..1 within the candidate
 * set) with query-term coverage. The previous version added raw points to
 * scores from incomparable scales and ran twice (per sub-query and again
 * globally), compounding the distortion.
 *
 * Output scores are scaled to 0..100 so they read as percentages downstream.
 * A cross-encoder (e.g. bge-reranker) is the intended upgrade path here.
 */
export const rerankChunks = (
  query: string,
  chunks: RetrievedChunk[],
): RetrievedChunk[] => {
  if (chunks.length === 0) return [];

  const queryTerms = Array.from(new Set(tokenize(query)));
  const maxScore = Math.max(...chunks.map((c) => c.score)) || 1;

  return chunks
    .map((chunk) => {
      const retrievalScore = chunk.score / maxScore;

      const text = chunk.text.toLowerCase();
      const coverage =
        queryTerms.length > 0
          ? queryTerms.filter((term) => text.includes(term)).length /
            queryTerms.length
          : 0;

      // Penalize fragments too short to be self-contained evidence.
      const qualityPenalty = chunk.text.length < 120 ? 0.15 : 0;

      const blended =
        0.7 * retrievalScore + 0.3 * coverage - qualityPenalty;

      return { ...chunk, score: Math.max(0, Math.round(blended * 100)) };
    })
    .sort((a, b) => b.score - a.score);
};
