/**
 * Formula guidance appended to the system prompt for calculation-intent
 * queries. The sources are already in the user message, so (unlike the
 * previous version) no truncated chunk excerpts are duplicated here.
 */
export const buildCalculationContext = () => `
CALCULATION RULES:
Use these formulas only with values present in the sources, and show the inputs you used:
- Growth Rate: ((Current - Previous) / Previous) * 100
- Profit Margin: (Profit / Revenue) * 100
- EBITDA Margin: (EBITDA / Revenue) * 100
- CAGR: ((Ending / Beginning)^(1/n) - 1) * 100
Never compute with values that do not appear in the sources. State the periods being compared.`;
