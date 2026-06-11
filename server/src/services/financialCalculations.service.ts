import { RetrievedChunk } from "../modules/retrieval/types/retrieval.types";

export const buildCalculationContext = (
  chunks: RetrievedChunk[],
  query: string,
) => {
  return `
Financial Calculation Guidance:

Question:
${query}

Use these formulas when applicable:

1. Growth Rate
((Current - Previous) / Previous) * 100

2. Profit Margin
(Profit / Revenue) * 100

3. EBITDA Margin
(EBITDA / Revenue) * 100

4. CAGR
((Ending / Beginning)^(1/n) - 1) * 100

Retrieved Financial Evidence:
${chunks
  .slice(0, 3)
  .map((chunk) => chunk.text.slice(0, 300))
  .join("\n\n")}
`;
};
