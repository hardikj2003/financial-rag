import { generateLLMResponse } from "../modules/llm/llm.service";
import { RetrievalMemory } from "../modules/retrieval/types/retrieval.types";

export const rewriteQuery = async (query: string, memory?: RetrievalMemory): Promise<string> => {
  try {
    const prompt = `
You are a financial information retrieval expert.

Conversation Context:
${JSON.stringify(memory)}

Transform the user's question into a search query optimized for:

- annual reports
- earnings calls
- SEC filings
- financial statements
- management discussion sections
- risk factors sections

Return only the search query.

Question:
${query}
`;

    const rewritten = await generateLLMResponse(prompt);

    if (!rewritten || rewritten.length < 5) {
      return query;
    }

    return rewritten.trim();
  } catch {
    return query;
  }
};
