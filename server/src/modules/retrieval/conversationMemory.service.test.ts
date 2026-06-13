import { describe, it, expect } from "vitest";
import type { Message } from "@prisma/client";
import { extractConversationMemory } from "./conversationMemory.service";

const message = (content: string): Message =>
  ({
    id: "m1",
    role: "user",
    content,
    createdAt: new Date(),
    chatId: "c1",
  }) as Message;

describe("extractConversationMemory", () => {
  it("detects the company and topics from history", () => {
    const memory = extractConversationMemory([
      message("what are reliance risk factors"),
      message("and their cash flow?"),
    ]);

    expect(memory.currentCompany).toBe("reliance");
    expect(memory.recentTopics).toContain("risk factors");
    expect(memory.recentTopics).toContain("cash flow");
  });

  it("uses the most recent company mention", () => {
    const memory = extractConversationMemory([
      message("tell me about reliance"),
      message("now switch to infosys margins"),
    ]);

    expect(memory.currentCompany).toBe("infosys");
  });

  it("does NOT leak state across calls (regression: module-level company)", () => {
    extractConversationMemory([message("tell me about reliance")]);

    const fresh = extractConversationMemory([
      message("what is the revenue trend"),
    ]);

    expect(fresh.currentCompany).toBeUndefined();
  });
});
