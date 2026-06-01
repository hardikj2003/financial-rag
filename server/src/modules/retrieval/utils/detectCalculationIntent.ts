const CALCULATION_KEYWORDS = [
  "growth",
  "increase",
  "decrease",
  "margin",
  "cagr",
  "change",
  "compare",
  "trend",
  "percentage",
  "ratio",
];

export const detectCalculationIntent = (query: string): boolean => {
  const lower = query.toLowerCase();

  return CALCULATION_KEYWORDS.some((keyword) => lower.includes(keyword));
};
