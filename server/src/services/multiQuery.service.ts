import { generateLLMResponse } from "../modules/llm/llm.service";
import { RetrievalMemory } from "../modules/retrieval/types/retrieval.types";
import { logger } from "../config/logger";

const MAX_QUERIES = 3;

/**
 * Generates alternate phrasings for recall. Output is validated line by line
 * (the previous version trusted raw LLM output as search queries) and capped
 * at MAX_QUERIES including the original.
 */
export const generateSearchQueries = async (
  query: string,
  memory?: RetrievalMemory,
): Promise<string[]> => {
  const contextLines = [
    memory?.currentCompany ? `Company in focus: ${memory.currentCompany}` : "",
    memory?.recentTopics?.length
      ? `Recent topics: ${memory.recentTopics.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `
Generate ${MAX_QUERIES - 1} alternative search queries to retrieve financial
report passages relevant to the user's question.

${contextLines}

User question:
${query}

Rules:
- One query per line, no numbering, no explanations
- Keep company names and financial terminology
- Each query must be a self-contained search phrase
`;

  try {
    const response = await generateLLMResponse(prompt);

    const generated = response
      .split("\n")
      .map((line) => line.replace(/^[\s\d.\-*•]+/, "").trim())
      .filter((line) => line.length >= 8 && line.length <= 200);

    return [query, ...generated].slice(0, MAX_QUERIES);
  } catch (error) {
    logger.warn("multi-query generation failed; using original query", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [query];
  }
};
