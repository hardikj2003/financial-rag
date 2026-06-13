import { Request, Response } from "express";
import { retrieveRelevantChunks } from "./retrieval.service";
import { buildFinancialPrompt } from "../../services/prompt.service";
import { streamLLMResponse } from "../llm/llm.service";
import {
  getRecentMessages,
  getChatForUser,
  storeMessage,
  updateChatTitle,
  DEFAULT_CHAT_TITLE,
} from "../memory/memory.service";
import { rewriteQuery } from "../memory/rewrite.service";
import { formatSourcesForPrompt } from "./sourceFormatter.service";
import { extractConversationMemory } from "./conversationMemory.service";
import { verifyAnswer } from "../../services/answerVerification.service";
import { analyzeQuery } from "./utils/queryAnalyzer";
import { buildCalculationContext } from "../../services/financialCalculations.service";
import { logger } from "../../config/logger";
import prisma from "../../config/prisma";

const MAX_QUERY_CHARS = 4000;

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

    if (trimmedQuery.length > MAX_QUERY_CHARS) {
      return res.status(400).json({
        success: false,
        error: `Query exceeds ${MAX_QUERY_CHARS} characters`,
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
    const analysis = analyzeQuery(rewrittenQuery);

    const retrievalStart = Date.now();
    const retrievedChunks = await retrieveRelevantChunks(
      rewrittenQuery,
      analysis,
      retrievalMemory,
    );
    const retrievalTimeMs = Date.now() - retrievalStart;

    const context = formatSourcesForPrompt(retrievedChunks);
    const hasTables = retrievedChunks.some((chunk) =>
      chunk.id.startsWith("table-"),
    );

    const prompt = buildFinancialPrompt(context, rewrittenQuery, analysis.type, {
      hasTables,
      calculationContext: analysis.needsCalculations
        ? buildCalculationContext()
        : undefined,
    });

    // Persist the user message BEFORE streaming so a mid-stream failure
    // doesn't silently drop it from history.
    await storeMessage(chatId, "user", trimmedQuery);

    // Title the chat from its first message only (previously overwritten on
    // every turn).
    if (chat.title === DEFAULT_CHAT_TITLE) {
      const title =
        trimmedQuery.length > 40
          ? trimmedQuery.slice(0, 40) + "..."
          : trimmedQuery;
      await updateChatTitle(chatId, req.userId, title);
    }

    const generationStart = Date.now();
    const stream = await streamLLMResponse(prompt);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";

    for await (const streamChunk of stream) {
      const token =
        typeof streamChunk.choices?.[0]?.delta?.content === "string"
          ? streamChunk.choices[0].delta.content
          : "";

      if (!token) continue;

      fullResponse += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    const generationTimeMs = Date.now() - generationStart;

    if (fullResponse) {
      await storeMessage(chatId, "assistant", fullResponse);
    }

    // Trim sources for the wire: no parentText payloads, no internal fields.
    const sources = retrievedChunks.map((chunk, index) => ({
      sourceId: index + 1,
      text: chunk.text,
      documentName: chunk.documentName,
      chunkIndex: chunk.chunkIndex,
      sectionTitle: chunk.sectionTitle,
      score: chunk.score,
    }));

    // Sources go out immediately. The previous flow blocked this event
    // behind a verification LLM round-trip, adding seconds of dead air.
    res.write(`data: ${JSON.stringify({ done: true, sources })}\n\n`);
    res.end();

    // Post-hoc verification + query analytics, off the request path.
    void (async () => {
      const verdict = await verifyAnswer(rewrittenQuery, context, fullResponse);

      if (verdict !== "SUPPORTED") {
        logger.warn("answer verification flagged response", {
          chatId,
          verdict,
          query: rewrittenQuery.slice(0, 200),
        });
      }

      await prisma.queryLog.create({
        data: {
          originalQuery: trimmedQuery,
          rewrittenQuery,
          retrievalTimeMs,
          generationTimeMs,
          totalSources: retrievedChunks.length,
        },
      });
    })().catch((error) => logger.error("post-response pipeline failed", error));
  } catch (error) {
    logger.error("chat request failed", error);

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
