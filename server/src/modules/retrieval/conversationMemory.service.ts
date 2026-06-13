import type { Message } from "@prisma/client";
import { RetrievalMemory } from "./types/retrieval.types";
import { detectCompany } from "./utils/companyDetector";

const TOPIC_PATTERNS: Array<[RegExp, string]> = [
  [/\brisks?\b/, "risk factors"],
  [/\bcapex|capital expenditure\b/, "capital expenditure"],
  [/\bcash flows?\b/, "cash flow"],
  [/\bmargins?|profitab/, "profitability"],
  [/\brevenue|sales\b/, "revenue"],
  [/\bliquidity\b/, "liquidity"],
];

/**
 * Derives retrieval hints from this chat's history only. All state is
 * request-local: a previous bug kept the detected company in a module-level
 * variable, leaking one user's context into other users' retrievals.
 */
export const extractConversationMemory = (
  messages: Message[],
): RetrievalMemory => {
  const recentTopics = new Set<string>();
  let currentCompany: string | undefined;

  for (const message of messages) {
    const company = detectCompany(message.content);
    if (company) {
      // Messages arrive oldest-first, so the most recent mention wins.
      currentCompany = company;
    }

    const content = message.content.toLowerCase();
    for (const [pattern, topic] of TOPIC_PATTERNS) {
      if (pattern.test(content)) {
        recentTopics.add(topic);
      }
    }
  }

  return {
    recentTopics: Array.from(recentTopics),
    currentCompany,
  };
};
