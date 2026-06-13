export type QueryType = "FACT_LOOKUP" | "ANALYSIS" | "COMPARISON" | "SUMMARY";

export interface QueryAnalysis {
  type: QueryType;
  sectionIntent: string | null;
  preferredSections: string[];
  wantsTables: boolean;
  needsCalculations: boolean;
}

const SECTION_RULES: Array<[RegExp, string]> = [
  [/\brisks?|threats?|uncertaint/, "risk factors"],
  [/\brevenue|sales\b/, "financial highlights"],
  [/\bprofit|earnings|margins?\b/, "results of operations"],
  [/\bcash flows?\b/, "cash flow"],
  [/\bliquidity\b/, "liquidity"],
  [/\binvestments?\b/, "investments"],
  [/\bcapex|capital expenditure/, "capital expenditure"],
];

const PREFERRED_SECTION_RULES: Array<[RegExp, string[]]> = [
  [/\brisks?\b/, ["risk factors"]],
  [/\bcapex|capital expenditure/, ["capital expenditure", "investments"]],
  [/\binvestments?\b/, ["investments"]],
  [/\bearnings\b/, ["earnings", "financial highlights"]],
  [/\brevenue\b/, ["revenue", "financial highlights"]],
  [/\boperations?\b/, ["results of operations", "operational performance"]],
  [/\bcash\b/, ["cash flow", "liquidity"]],
  [/\bliquidity\b/, ["liquidity"]],
  [/\bsegments?\b/, ["segment performance"]],
  [/\boverview\b/, ["business overview"]],
];

const TABLE_PATTERN =
  /\brevenue|profit|income|ebitda|margins?|cash flow|balance sheet|assets|liabilities|quarterly|financial statement|growth|capex\b/;

const CALCULATION_PATTERN =
  /\bgrowth|increase|decrease|margins?|cagr|change|compare|trend|percentage|ratio\b/;

const SUMMARY_PATTERN = /\bsummariz|summary|brief\b/;

const ANALYSIS_PATTERN =
  /\btell me about|explain|analy[sz]|discuss|trend|growth|performance|overview|review\b/;

const classify = (q: string): QueryType => {
  if (/\bcompare\b|\bvs\.?\b|\bversus\b/.test(q)) {
    return "COMPARISON";
  }

  if (SUMMARY_PATTERN.test(q)) {
    return "SUMMARY";
  }

  if (ANALYSIS_PATTERN.test(q)) {
    return "ANALYSIS";
  }

  if (/^(what is|what was|how much|how many|when|where)\b/.test(q)) {
    return "FACT_LOOKUP";
  }

  return "ANALYSIS";
};

export const analyzeQuery = (query: string): QueryAnalysis => {
  const q = query.toLowerCase().trim();

  const sectionRule = SECTION_RULES.find(([pattern]) => pattern.test(q));

  const preferredSections = PREFERRED_SECTION_RULES.flatMap(
    ([pattern, sections]) => (pattern.test(q) ? sections : []),
  );

  return {
    type: classify(q),
    sectionIntent: sectionRule ? sectionRule[1] : null,
    preferredSections: Array.from(new Set(preferredSections)),
    wantsTables: TABLE_PATTERN.test(q),
    needsCalculations: CALCULATION_PATTERN.test(q),
  };
};
