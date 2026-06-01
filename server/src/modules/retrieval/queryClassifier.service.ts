export type QueryType = "FACT_LOOKUP" | "ANALYSIS" | "COMPARISON" | "SUMMARY";

export const classifyQuery = (query: string): QueryType => {
  const q = query.toLowerCase();

  if (q.includes("compare") || q.includes("vs") || q.includes("versus")) {
    return "COMPARISON";
  }

  if (q.includes("summarize") || q.includes("summary")) {
    return "SUMMARY";
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
