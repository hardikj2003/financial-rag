import { Message } from "@prisma/client";
import { RetrievalMemory } from "./types/retrieval.types";

export const extractConversationMemory = (
  messages: Message[],
): RetrievalMemory => {
  const recentTopics: string[] = [];
  const recentDocuments: string[] = [];
  const recentSections: string[] = [];

  for (const message of messages) {
    const content = message.content.toLowerCase();
    // Financial Topic Extraction
    if (content.includes("risk")) {
      recentTopics.push("risk factors");
    }
    if (content.includes("capex")) {
      recentTopics.push("capital expenditure");
    }
    if (content.includes("cash flow")) {
      recentTopics.push("cash flow");
    }
    if (content.includes("margin")) {
      recentTopics.push("profitability");
    }
    // Company Tracking
    if (content.includes("reliance")) {
      recentDocuments.push("Reliance");
    }
  }

  return {
    recentTopics: Array.from(new Set(recentTopics)),
    recentDocuments: Array.from(new Set(recentDocuments)),
    recentSections: Array.from(new Set(recentSections)),
  };
};
