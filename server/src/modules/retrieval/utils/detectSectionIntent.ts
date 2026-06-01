export const detectSectionIntent = (query: string): string | null => {
  const q = query.toLowerCase();

  if (q.includes("risk") || q.includes("threat") || q.includes("uncertainty")) {
    return "risk factors";
  }

  if (q.includes("revenue") || q.includes("sales")) {
    return "financial highlights";
  }

  if (q.includes("profit") || q.includes("earnings") || q.includes("margin")) {
    return "results of operations";
  }

  if (q.includes("cash flow")) {
    return "cash flow";
  }

  if (q.includes("liquidity")) {
    return "liquidity";
  }

  if (q.includes("investment")) {
    return "investments";
  }

  if (q.includes("capex") || q.includes("capital expenditure")) {
    return "capital expenditure";
  }

  return null;
};
