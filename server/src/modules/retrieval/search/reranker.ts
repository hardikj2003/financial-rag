import { RetrievedChunk } from "../types/retrieval.types";

const FINANCIAL_TERMS = [
  "revenue",
  "ebitda",
  "margin",
  "growth",
  "guidance",
  "profit",
  "debt",
  "cash flow",
  "capex",
  "earnings",
  "investment",
];

const calculateFinancialBoost = (text: string) => {
  const lower = text.toLowerCase();
  let boost = 0;

  for (const term of FINANCIAL_TERMS) {
    if (lower.includes(term)) {
      boost += 1;
    }
  }

  return boost;
};

const calculateQueryOverlap = (text: string, query: string) => {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  let overlap = 0;

  for (const term of queryTerms) {
    if (textLower.includes(term)) {
      overlap += 1;
    }
  }

  return overlap;
};

const calculateChunkQuality = (text: string) => {
  // Penalize tiny/noisy chunks
  if (text.length < 120) {
    return -2;
  }
  // Penalize OCR garbage
  const weirdChars = (text.match(/[%$#@]{3,}/g) || []).length;
  return weirdChars > 3 ? -3 : 2;
};

export const rerankChunks = (query: string, chunks: RetrievedChunk[]) => {
  return chunks
    .map((chunk) => {
      const financialBoost = calculateFinancialBoost(chunk.text);
      const queryOverlap = calculateQueryOverlap(chunk.text, query);
      const qualityScore = calculateChunkQuality(chunk.text);
      const finalScore =
        chunk.score + financialBoost * 2 + queryOverlap * 3 + qualityScore;

      return {
        ...chunk,
        score: finalScore,
      };
    })
    .sort((a, b) => b.score - a.score);
};
