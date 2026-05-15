import qdrantClient from "../../qdrant/qdrant.client";
import { RetrievedChunk } from "../types/retrieval.types";

const calculateKeywordScore = (text: string, query: string) => {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  let score = 0;

  for (const term of queryTerms) {
    if (textLower.includes(term)) {
      score += 1;
    }
  }
  return score;
};

export const keywordSearch = async (
  query: string,
): Promise<RetrievedChunk[]> => {
  const scrollResult = await qdrantClient.scroll("financial_docs", {
    limit: 80,
    with_payload: true,
    with_vector: false,
  });

  const scored = scrollResult.points
    .map((point: any) => {
      const text = point.payload?.text || "";
      const keywordScore = calculateKeywordScore(text, query);

      return {
        id: point.id,
        text,
        documentName: point.payload?.documentName || "Financial Report",
        chunkIndex: point.payload?.chunkIndex || 0,
        score: keywordScore,
        metadata: point.payload || {},
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored;
};
