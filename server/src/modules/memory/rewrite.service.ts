import type { Message } from "@prisma/client";
import { generateLLMResponse } from "../llm/llm.service";
import { logger } from "../../config/logger";

const MAX_MESSAGE_CHARS = 500;
const MAX_REWRITTEN_CHARS = 400;

/**
 * Resolves pronouns/references in the latest user message into a standalone
 * search query. Skipped by the caller when there is no history. History
 * messages and the rewritten output are length-capped so a long answer in
 * history can't blow up the prompt, and malformed LLM output falls back to
 * the original query instead of becoming the search string.
 */
export const rewriteQuery = async (
  query: string,
  history: Message[],
): Promise<string> => {
  if (history.length === 0) {
    return query;
  }

  const formattedHistory = history
    .map(
      (msg) =>
        `${msg.role.toUpperCase()}: ${msg.content.slice(0, MAX_MESSAGE_CHARS)}`,
    )
    .join("\n");

  const prompt = {
    system: `You rewrite the latest user message into a complete standalone financial search query.
Rules:
1. Preserve the original intent.
2. Resolve references ("it", "they", "that company") using the conversation history.
3. Preserve company names, tickers, dates, quarters, metrics.
4. Output ONLY the rewritten query — no explanations, no answer.`,
    user: `CONVERSATION HISTORY:
${formattedHistory}

LATEST USER QUERY:
${query}

REWRITTEN STANDALONE QUERY:`,
  };

  try {
    const rewritten = (await generateLLMResponse(prompt, { fast: true })).trim();

    // Defend against the model answering instead of rewriting.
    if (
      rewritten.length === 0 ||
      rewritten.length > MAX_REWRITTEN_CHARS ||
      rewritten.includes("\n\n")
    ) {
      return query;
    }

    return rewritten;
  } catch (error) {
    logger.warn("query rewrite failed; using original query", {
      error: error instanceof Error ? error.message : String(error),
    });
    return query;
  }
};
