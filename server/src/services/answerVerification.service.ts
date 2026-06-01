import { generateLLMResponse } from "../modules/llm/llm.service";

let verifiedAnswers = 0;
let unsupportedAnswers = 0;

export const verifyAnswer = async (
  query: string,
  context: string,
  answer: string,
): Promise<boolean> => {
  const prompt = `
You are a financial compliance verifier.

Question:
${query}

Context:
${context}

Answer:
${answer}

Check:

1. Are all factual claims supported?
2. Are financial figures supported?
3. Are percentages supported?
4. Are conclusions supported?

Return ONLY:

SUPPORTED

or

UNSUPPORTED
`;

  const result = await generateLLMResponse(prompt);

  return result.trim().toUpperCase().includes("SUPPORTED");
};

export const logVerification = (query: string, supported: boolean) => {
  if (supported) {
    verifiedAnswers++;
  } else {
    unsupportedAnswers++;
  }

  if (!supported) {
    console.warn("UNSUPPORTED ANSWER DETECTED");
  }

  console.log("VERIFICATION:", {
    query,
    supported,
  });

  console.log("VERIFICATION STATS:", {
    verifiedAnswers,
    unsupportedAnswers,
    total: verifiedAnswers + unsupportedAnswers,
  });
};
