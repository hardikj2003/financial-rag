import { generateLLMResponse } from "../modules/llm/llm.service";
import { logger } from "../config/logger";

export type Verdict = "SUPPORTED" | "UNSUPPORTED" | "UNKNOWN";

/**
 * Order matters: "UNSUPPORTED".includes("SUPPORTED") is true, so the
 * negative verdict must be checked first.
 */
export const parseVerdict = (raw: string): Verdict => {
  const normalized = raw.trim().toUpperCase();

  if (normalized.includes("UNSUPPORTED")) {
    return "UNSUPPORTED";
  }

  if (normalized.includes("SUPPORTED")) {
    return "SUPPORTED";
  }

  return "UNKNOWN";
};

export const verifyAnswer = async (
  query: string,
  context: string,
  answer: string,
): Promise<Verdict> => {
  // Nothing to verify when the model declined to answer.
  if (answer.includes("could not find relevant information")) {
    return "SUPPORTED";
  }

  const prompt = `
You are a financial compliance verifier.

Question:
${query}

Context:
${context}

Answer:
${answer}

Check:
1. Are all factual claims supported by the context?
2. Are all financial figures and percentages supported?
3. Are all conclusions supported?

Respond with exactly one word: SUPPORTED or UNSUPPORTED.
`;

  try {
    const result = await generateLLMResponse(prompt);
    return parseVerdict(result);
  } catch (error) {
    logger.error("answer verification failed", error);
    return "UNKNOWN";
  }
};
