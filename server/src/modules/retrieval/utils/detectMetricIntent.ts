export const detectMetricIntent = (query: string) => {
  const lower = query.toLowerCase();

  if (lower.includes("revenue")) {
    return "Revenue";
  }

  if (lower.includes("ebitda")) {
    return "EBITDA";
  }

  if (lower.includes("profit")) {
    return "Profit";
  }

  return null;
};
