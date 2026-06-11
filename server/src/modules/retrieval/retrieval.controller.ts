import { Request, Response } from "express";
import { retrieveRelevantChunks } from "./retrieval.service";
import { buildFinancialPrompt } from "../../services/prompt.service";
import { streamLLMResponse } from "../llm/llm.service";
import {
  getRecentMessages,
  getChatForUser,
  storeMessage,
  updateChatTitle,
} from "../memory/memory.service";
import { rewriteQuery } from "../memory/rewrite.service";
import { formatSourcesForPrompt } from "./sourceFormatter.service";
import { extractConversationMemory } from "./conversationMemory.service";
import { compressContext } from "../../services/contextCompression.service";
import {
  verifyAnswer,
  logVerification,
} from "../../services/answerVerification.service";
import { classifyQuery } from "./queryClassifier.service";
import { detectCalculationIntent } from "./utils/detectCalculationIntent";
import { buildCalculationContext } from "../../services/financialCalculations.service";

export const financialChatController = async (req: Request, res: Response) => {
  try {
    const { query, chatId } = req.body;

    if (typeof query !== "string" || typeof chatId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query and chatId required",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return res.status(400).json({
        success: false,
        error: "Query cannot be empty",
      });
    }

    const chat = await getChatForUser(chatId, req.userId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Chat not found",
      });
    }

    const history = await getRecentMessages(chatId, req.userId);
    const retrievalMemory = extractConversationMemory(history);
    const rewrittenQuery = await rewriteQuery(trimmedQuery, history);
    const queryType = classifyQuery(trimmedQuery);
    const retrievedChunks = await retrieveRelevantChunks(
      rewrittenQuery,
      retrievalMemory,
    );

    const compressedChunks = compressContext(rewrittenQuery, retrievedChunks);
    const context = formatSourcesForPrompt(compressedChunks);
    const needsCalculations = detectCalculationIntent(trimmedQuery);

    const calculationInsights = needsCalculations
      ? buildCalculationContext(compressedChunks, trimmedQuery)
      : "";
    const prompt = buildFinancialPrompt(
      context,
      rewrittenQuery,
      queryType,
      calculationInsights,
    );
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

    await storeMessage(chatId, "user", trimmedQuery);
    const trimmedTitle =
      trimmedQuery.length > 40 ? trimmedQuery.slice(0, 40) + "..." : trimmedQuery;

    await updateChatTitle(chatId, req.userId, trimmedTitle);
    await storeMessage(chatId, "assistant", fullResponse);

    const supported = await verifyAnswer(rewrittenQuery, context, fullResponse);

    logVerification(rewrittenQuery, supported);

    const cleanedSources = compressedChunks.map((chunk, index) => ({
      sourceId: index + 1,
      ...chunk,
    }));

    res.write(
      `data: ${JSON.stringify({
        done: true,
        verified: supported,
        sources: cleanedSources,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error(error);
    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          done: true,
          error: "Failed to generate response",
        })}\n\n`,
      );
      res.end();
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to generate response",
    });
  }
};
