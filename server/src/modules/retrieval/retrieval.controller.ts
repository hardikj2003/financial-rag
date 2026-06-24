import { Request, Response } from "express";
import { retrieveRelevantChunks } from "./retrieval.service";
import { buildFinancialPrompt } from "../../services/prompt.service";
import { streamLLMResponse, isRateLimitError } from "../llm/llm.service";
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
import { QueryTracer } from "../../services/tracing/queryTracer";

const MAX_QUERY_CHARS = 4000;

const ADVICE_DISCLAIMER =
  "\n\n---\n\n*⚠️ **Disclaimer:** I am not a financial advisor and this is not investment advice. This comparison is generated from the uploaded documents for educational and informational purposes only. Markets carry risk — please do your own research and consult a SEBI-registered financial advisor before making any investment decision.*";

export const financialChatController = async (req: Request, res: Response) => {
  let tracer: QueryTracer | undefined;
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

    // Analyze the rewritten query (which resolves pronouns like "it" using
    // history) but union the intent with the original phrasing: the rewrite can
    // add companies from context, while the original keeps advice wording the
    // rewrite may strip ("...should I invest in?").
    const analysis = analyzeQuery(rewrittenQuery);
    const originalAnalysis = analyzeQuery(trimmedQuery);
    analysis.companies = Array.from(
      new Set([...analysis.companies, ...originalAnalysis.companies]),
    );
    analysis.isAdvice = analysis.isAdvice || originalAnalysis.isAdvice;
    if (analysis.companies.length >= 2) {
      analysis.type = "COMPARISON";
    }

    tracer = new QueryTracer({
      chatId,
      userId: req.userId,
      originalQuery: trimmedQuery,
    });
    tracer.setAnalysis({
      rewrittenQuery,
      queryType: analysis.type,
      companies: analysis.companies,
      isComparison: analysis.type === "COMPARISON",
      isAdvice: analysis.isAdvice,
    });
    tracer.setMemory(retrievalMemory.currentCompany, retrievalMemory.recentTopics);

    const retrievalStart = Date.now();
    const retrievedChunks = await retrieveRelevantChunks(
      rewrittenQuery,
      analysis,
      retrievalMemory,
      tracer,
    );
    const retrievalTimeMs = Date.now() - retrievalStart;
    tracer.setRetrievalMs(retrievalTimeMs);
    tracer.setFinalSources(retrievedChunks);

    if (retrievedChunks.length === 0) {
      tracer.setFailureType("no_results");
    }

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
    tracer.recordPrompt(prompt.system ?? "", context, `${prompt.system ?? ""}\n\n${prompt.user}`);

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
    let firstTokenAt = 0;

    for await (const streamChunk of stream) {
      const token =
        typeof streamChunk.choices?.[0]?.delta?.content === "string"
          ? streamChunk.choices[0].delta.content
          : "";

      if (!token) continue;

      if (!firstTokenAt) firstTokenAt = Date.now();
      fullResponse += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    // Append an educational disclaimer for investment/recommendation queries.
    // Done deterministically (not via the prompt) so it can never be omitted.
    if (analysis.isAdvice && fullResponse.trim()) {
      res.write(`data: ${JSON.stringify({ token: ADVICE_DISCLAIMER })}\n\n`);
      fullResponse += ADVICE_DISCLAIMER;
    }

    const generationTimeMs = Date.now() - generationStart;
    const streamMs = firstTokenAt ? Date.now() - firstTokenAt : 0;
    tracer.setOutputText(fullResponse);
    tracer.recordGeneration("llama-3.3-70b-versatile", fullResponse, generationTimeMs, streamMs);

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

    // Post-hoc verification + trace persistence, off the request path.
    const activeTracer = tracer;
    void (async () => {
      const verificationStart = Date.now();
      const verdict = await verifyAnswer(rewrittenQuery, context, fullResponse);
      activeTracer.recordVerification(
        verdict,
        fullResponse,
        Date.now() - verificationStart,
      );

      if (verdict !== "SUPPORTED") {
        logger.warn("answer verification flagged response", {
          chatId,
          verdict,
          query: rewrittenQuery.slice(0, 200),
        });
        if (verdict === "UNSUPPORTED") {
          activeTracer.setFailureType("verification_failed");
        }
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

      await activeTracer.persist();
    })().catch((error) => logger.error("post-response pipeline failed", error));
  } catch (error) {
    logger.error("chat request failed", error);

    const rateLimited = isRateLimitError(error);
    const message = rateLimited
      ? "The daily AI usage limit has been reached. Please try again later."
      : "Failed to generate response";

    // Capture the failure in the trace before responding.
    if (tracer) {
      tracer.setError(
        rateLimited ? "rate_limited" : "error",
        rateLimited ? "rate_limited" : "stream_failed",
        error instanceof Error ? error.message : String(error),
      );
      void tracer.persist();
    }

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ done: true, error: message })}\n\n`);
      res.end();
      return;
    }

    res.status(rateLimited ? 429 : 500).json({
      success: false,
      error: message,
    });
  }
};
