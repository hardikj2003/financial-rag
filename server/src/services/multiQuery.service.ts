import { generateLLMResponse } from "../modules/llm/llm.service";
import { RetrievalMemory } from "../modules/retrieval/types/retrieval.types";

export const generateSearchQueries = async (
  query: string,
  memory?: RetrievalMemory,
): Promise<string[]> => {
  try {
    const prompt = `
You are a retrieval expert.

Generate 5 search queries that could help retrieve
financial information related to the user's question.

Conversation Context:
${JSON.stringify(memory)}

User Question:
${query}

Rules:
- One query per line
- Keep company names
- Use financial terminology
- No numbering
- No explanations
`;

    const response = await generateLLMResponse(prompt);

    const queries = response
      .split("\n")
      .map((q:any) => q.trim())
      .filter(Boolean);

    return [query, ...queries].slice(0, 5);
  } catch {
    return [query];
  }
};
