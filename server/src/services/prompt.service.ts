export const buildFinancialPrompt = (
  context: string,
  query: string
) => {
  return `
You are an expert AI Financial Research Assistant.

Use ONLY the provided financial context
to answer the user's question.

If partial information exists,
provide the best grounded answer possible.

Do NOT hallucinate facts.

If the information is unavailable,
clearly say so.

-----------------------------------
FINANCIAL CONTEXT
-----------------------------------

${context}

-----------------------------------
USER QUESTION
-----------------------------------

${query}

-----------------------------------
ANSWER
-----------------------------------
`;
};