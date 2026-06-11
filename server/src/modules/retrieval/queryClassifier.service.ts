export type QueryType = "FACT_LOOKUP" | "ANALYSIS" | "COMPARISON" | "SUMMARY";

const ANALYSIS_KEYWORDS = [
  "tell me about",
  "explain",
  "analyze",
  "analysis",
  "discuss",
  "trend",
  "growth",
  "performance",
  "overview",
  "review",
];

const SUMMARY_KEYWORDS = ["summarize", "summary", "brief"];

export const classifyQuery = (query: string): QueryType => {
  const q = query.toLowerCase().trim();

  if (q.includes("compare") || q.includes("vs") || q.includes("versus")) {
    return "COMPARISON";
  }

  if (SUMMARY_KEYWORDS.some((word) => q.includes(word))) {
    return "SUMMARY";
  }

  if (ANALYSIS_KEYWORDS.some((word) => q.includes(word))) {
    return "ANALYSIS";
  }

  if (
    q.startsWith("what is") ||
    q.startsWith("how much") ||
    q.startsWith("when") ||
    q.startsWith("where")
  ) {
    return "FACT_LOOKUP";
  }

  return "ANALYSIS";
};
