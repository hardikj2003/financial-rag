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

    if (!query || !chatId) {
      return res.status(400).json({
        success: false,
        error: "Query and chatId required",
      });
    }

    const history = await getRecentMessages(chatId);
    const retrievalMemory = extractConversationMemory(history);
    const rewrittenQuery = await rewriteQuery(query, history);
    const queryType = classifyQuery(query);

    console.log("QUERY TYPE:", queryType);
    const retrievedChunks = await retrieveRelevantChunks(
      rewrittenQuery,
      retrievalMemory,
    );

    const compressedChunks = compressContext(rewrittenQuery, retrievedChunks);
    const context = formatSourcesForPrompt(compressedChunks);
    console.log("RETRIEVED CHUNKS:", retrievedChunks.length);

    console.log("COMPRESSED CHUNKS:", compressedChunks.length);

    console.log("CONTEXT SIZE:", context.length);
    const needsCalculations = detectCalculationIntent(query);

    const calculationContext = needsCalculations
      ? buildCalculationContext()
      : "";
    const prompt = buildFinancialPrompt(
      context,
      rewrittenQuery,
      queryType,
      calculationContext,
    );
    console.log("PROMPT SIZE:", prompt.length);
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
    res.end();
  }
};
