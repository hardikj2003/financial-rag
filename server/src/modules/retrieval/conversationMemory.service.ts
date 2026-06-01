import { Message } from "@prisma/client";
import { RetrievalMemory } from "./types/retrieval.types";
import { detectCompany } from "./utils/companyDetector";

let currentCompany: string | undefined;

export const extractConversationMemory = (
  messages: Message[],
): RetrievalMemory => {
  const recentTopics: string[] = [];
  const recentDocuments: string[] = [];
  const recentSections: string[] = [];

  for (const message of messages) {
    console.log("MESSAGE:", message.content);
    const company = detectCompany(message.content);
    if (company) {
      currentCompany = company;
    }
    console.log("DETECTED COMPANY:", company);
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

  console.log("CURRENT COMPANY:", currentCompany);

  return {
    recentTopics: Array.from(new Set(recentTopics)),
    recentDocuments: Array.from(new Set(recentDocuments)),
    recentSections: Array.from(new Set(recentSections)),
    currentCompany,
  };
};
