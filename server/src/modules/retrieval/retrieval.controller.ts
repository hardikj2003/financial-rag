import { Request, Response } from "express";

import { retrieveRelevantChunks } from "./retrieval.service";

import { buildFinancialPrompt } from "../../services/prompt.service";

import { streamLLMResponse } from "../llm/llm.service";

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

    const stream = await streamLLMResponse(prompt);

    res.setHeader("Content-Type", "text/event-stream");

    res.setHeader("Cache-Control", "no-cache");

    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";

      fullResponse += token;

      res.write(
        `data: ${JSON.stringify({
          token,
        })}\n\n`,
      );
    }

    await storeMessage(chatId, "user", query);

    await storeMessage(chatId, "assistant", fullResponse);

    res.write(
      `data: ${JSON.stringify({
        done: true,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error(error);

    res.end();
  }
};
