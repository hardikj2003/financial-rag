import { RetrievedChunk } from "../types/retrieval.types";

const HIGH_VALUE_SECTIONS = [
  "management discussion",
  "results of operations",
  "operational performance",
  "capital expenditure",
  "financial highlights",
  "business overview",
  "segment performance",
  "liquidity",
  "cash flow",
];

const LOW_VALUE_SECTIONS = [
  "notes",
  "accounting",
  "financial statements",
  "auditor",
  "disclosures",
];

export const applyMetadataBoost = (chunks: RetrievedChunk[]) => {
  return chunks.map((chunk) => {
    const section = (chunk.sectionTitle || "").toLowerCase();

    let boost = 0;

    // High-value financial sections
    for (const highValue of HIGH_VALUE_SECTIONS) {
      if (section.includes(highValue)) {
        boost += 8;
      }
    }

    // Penalize noisy sections
    for (const lowValue of LOW_VALUE_SECTIONS) {
      if (section.includes(lowValue)) {
        boost -= 5;
      }
    }

    return {
      ...chunk,
      score: chunk.score + boost,
    };
  });
};
