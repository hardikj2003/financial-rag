import { Request, Response } from "express";
import { retrieveRelevantChunks } from "./retrieval.service";
import { buildFinancialPrompt } from "../../services/prompt.service";
import { streamLLMResponse } from "../llm/llm.service";
import {
  getRecentMessages,
  storeMessage,
  updateChatTitle,
} from "../memory/memory.service";
import { rewriteQuery } from "../memory/rewrite.service";
import { formatSourcesForPrompt } from "./sourceFormatter.service";
import { extractConversationMemory } from "./conversationMemory.service";

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
    const retrievalMemory = extractConversationMemory(history);
    const rewrittenQuery = await rewriteQuery(query, history);
    const retrievedChunks = await retrieveRelevantChunks(
      rewrittenQuery,
      retrievalMemory,
    );

    const context = formatSourcesForPrompt(retrievedChunks);

    const prompt = buildFinancialPrompt(context, rewrittenQuery);
    const stream = await streamLLMResponse(prompt);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    for await (const streamChunk of stream) {
      const token =
        typeof streamChunk.choices?.[0]?.delta?.content === "string"
          ? streamChunk.choices?.[0]?.delta?.content
          : "";

      fullResponse += token;

      res.write(
        `data: ${JSON.stringify({
          token,
        })}\n\n`,
      );
    }

    await storeMessage(chatId, "user", query);
    const trimmedTitle = query.length > 40 ? query.slice(0, 40) + "..." : query;

    await updateChatTitle(chatId, trimmedTitle);
    await storeMessage(chatId, "assistant", fullResponse);

    const cleanedSources = retrievedChunks;

    res.write(
      `data: ${JSON.stringify({
        done: true,
        sources: cleanedSources,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error(error);
    res.end();
  }
};
