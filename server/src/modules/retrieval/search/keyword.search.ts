import qdrantClient from "../../qdrant/qdrant.client";
import { RetrievedChunk } from "../types/retrieval.types";

const calculateKeywordScore = (text: string, query: string) => {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  for (const term of queryTerms) {
    const matches = words.filter((word) => word === term).length;
    score += matches;
  }
  return score;
};

const applyMetadataKeywordBoost = (
  query: string,
  sectionTitle: string,
  currentScore: number,
) => {
  const queryLower = query.toLowerCase();
  const section = sectionTitle.toLowerCase();
  let score = currentScore;

  // Risk Factors
  if (queryLower.includes("risk") && section.includes("risk")) {
    score += 10;
  }
  // Revenue
  if (
    queryLower.includes("revenue") &&
    (section.includes("financial highlights") ||
      section.includes("results of operations"))
  ) {
    score += 10;
  }

  // Earnings / Profitability
  if (
    (queryLower.includes("earnings") ||
      queryLower.includes("profit") ||
      queryLower.includes("margin")) &&
    (section.includes("financial highlights") ||
      section.includes("results of operations"))
  ) {
    score += 10;
  }

  // Cash Flow
  if (queryLower.includes("cash flow") && section.includes("cash flow")) {
    score += 10;
  }

  // Liquidity
  if (queryLower.includes("liquidity") && section.includes("liquidity")) {
    score += 10;
  }

  // Investments
  if (queryLower.includes("investment") && section.includes("investment")) {
    score += 10;
  }

  // Capital Expenditure
  if (
    (queryLower.includes("capex") ||
      queryLower.includes("capital expenditure")) &&
    section.includes("capital expenditure")
  ) {
    score += 10;
  }

  return score;
};

export const keywordSearch = async (
  query: string,
): Promise<RetrievedChunk[]> => {
  const scrollResult = await qdrantClient.scroll("financial_docs", {
    limit: 200,
    with_payload: true,
    with_vector: false,
  });

  const scored = scrollResult.points
    .map((point: any) => {
      const text = point.payload?.text || "";
      const sectionTitle = point.payload?.sectionTitle || "general";
      let keywordScore = calculateKeywordScore(text, query);

      keywordScore = applyMetadataKeywordBoost(
        query,
        sectionTitle,
        keywordScore,
      );

      return {
        id: String(point.id),
        text,
        documentName: point.payload?.documentName || "Financial Report",
        chunkIndex: point.payload?.chunkIndex || 0,
        score: keywordScore,
        metadata: point.payload || {},
        companyName: point.payload?.companyName,
        sectionTitle,
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return scored;
};
