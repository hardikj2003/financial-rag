const TABLE_KEYWORDS = [
  "revenue",
  "profit",
  "income",
  "ebitda",
  "margin",
  "cash flow",
  "balance sheet",
  "assets",
  "liabilities",
  "quarterly",
  "financial statement",
  "growth",
  "capex",
];

export const detectTableIntent = (
  query: string,
): boolean => {
  const lower =
    query.toLowerCase();

  return TABLE_KEYWORDS.some(
    (keyword) =>
      lower.includes(keyword),
  );
};