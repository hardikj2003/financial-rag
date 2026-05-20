interface MetadataHints {
  preferredSections: string[];
}

export const queryMetadataRouter = (query: string): MetadataHints => {
  const lower = query.toLowerCase();
  const preferredSections: string[] = [];

  const mappings: Record<string, string[]> = {
    risk: ["risk factors"],
    capex: ["capital expenditure", "investments"],
    investment: ["investments"],
    earnings: ["earnings", "financial highlights"],
    revenue: ["revenue"],
    operations: ["results of operations", "operational performance"],
    cash: ["cash flow", "liquidity"],
    liquidity: ["liquidity"],
    segment: ["segment performance"],
    overview: ["business overview"],
  };

  for (const [keyword, sections] of Object.entries(mappings)) {
    if (lower.includes(keyword)) {
      preferredSections.push(...sections);
    }
  }

  return {
    preferredSections,
  };
};
