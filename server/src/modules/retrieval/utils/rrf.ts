import { RetrievedChunk } from "../types/retrieval.types";

export const reciprocalRankFusion = (
  rankings: RetrievedChunk[][],
  k = 60,
): RetrievedChunk[] => {
  const scores = new Map<
    string,
    RetrievedChunk & {
      rrfScore: number;
    }
  >();

  rankings.forEach((ranking) => {
    ranking.forEach((chunk, rank) => {
      const id = String(chunk.id);

      const score = 1 / (k + rank + 1);

      if (!scores.has(id)) {
        scores.set(id, {
          ...chunk,
          rrfScore: score,
        });
      } else {
        scores.get(id)!.rrfScore += score;
      }
    });
  });

  return Array.from(scores.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .map(({ rrfScore, ...chunk }) => chunk);
};
