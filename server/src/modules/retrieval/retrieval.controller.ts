import { Request, Response } from "express";

import { retrieveRelevantChunks } from "./retrieval.service";

import { buildFinancialPrompt } from "../../services/prompt.service";

import { generateLLMResponse } from "../llm/llm.service";

import { getRecentMessages, storeMessage } from "../memory/memory.service";

import { rewriteQuery } from "../memory/rewrite.service";

export const financialChatController = async (req: Request, res: Response) => {
  try {
    const { query, chatId } = req.body;

    if (!query || !chatId) {
      return res.status(400).json({
        success: false,
        error: "Query and chatId required",
      });
    }

    const history = await getRecentMessages(chatId);

    const rewrittenQuery = await rewriteQuery(query, history);

    const retrievedChunks = await retrieveRelevantChunks(rewrittenQuery);

    const context = retrievedChunks
      .map((chunk: any) => chunk.payload?.text)
      .join("\n\n");

    const prompt = buildFinancialPrompt(context, rewrittenQuery);

    const answer = await generateLLMResponse(prompt);

    await storeMessage(chatId, "user", query);

    await storeMessage(chatId, "assistant", answer || "");

    return res.json({
      success: true,

      rewrittenQuery,

      answer,

      sources: retrievedChunks,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Conversational chat failed",
    });
  }
};
