import { generateLLMResponse } from "../llm/llm.service";

export const rewriteQuery = async (query: string, history: any[]) => {
  const formattedHistory = history
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n");

  const prompt = `
You are an expert financial query rewriting assistant.

Your task is to convert the latest user message
into a complete standalone financial query.

-----------------------------------
RULES
-----------------------------------

1. Preserve the original intent.
2. Resolve references like:
- "it"
- "they"
- "that company"
- "their earnings"
using conversation history.
3. Preserve:
- company names
- stock tickers
- dates
- quarters
- metrics
- financial terminology
4. Expand vague questions into searchable financial queries.
5. Keep the rewritten query concise but information-rich.
6. Do NOT answer the question.
7. Output ONLY the rewritten query.
-----------------------------------
CONVERSATION HISTORY
-----------------------------------
${formattedHistory}
-----------------------------------
LATEST USER QUERY
-----------------------------------
${query}
-----------------------------------
REWRITTEN STANDALONE QUERY
-----------------------------------
`;

  const rewritten = await generateLLMResponse(prompt);

  return rewritten?.trim() || query;
};
