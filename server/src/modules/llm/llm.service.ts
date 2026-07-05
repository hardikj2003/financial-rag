import Groq from "groq-sdk";

// Lazy init: the SDK throws when constructed without an API key, which
// would crash any module that merely imports this service (e.g. in tests).
let groqClient: Groq | undefined;

const groq = () => {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
};

// The 70B model answers the user. Auxiliary calls (query rewrite, multi-query
// expansion, answer verification) go to a cheaper, separately rate-limited
// model so they don't drain the 70B token-per-day budget.
const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const FAST_MODEL = process.env.GROQ_FAST_MODEL ?? "llama-3.1-8b-instant";
const REQUEST_TIMEOUT_MS = 60_000;

// Cap output so the per-minute token budget (input + reserved output) isn't
// blown. Without an explicit limit Groq reserves a large default, which alone
// can exceed free-tier TPM and trigger a 413 "request too large".
const ANSWER_MAX_TOKENS = Number(process.env.GROQ_MAX_OUTPUT_TOKENS ?? 1200);
const FAST_MAX_TOKENS = Number(process.env.GROQ_FAST_MAX_TOKENS ?? 512);

export interface ChatPrompt {
  system?: string;
  user: string;
}

const toMessages = (prompt: string | ChatPrompt) => {
  if (typeof prompt === "string") {
    return [{ role: "user" as const, content: prompt }];
  }

  return [
    ...(prompt.system
      ? [{ role: "system" as const, content: prompt.system }]
      : []),
    { role: "user" as const, content: prompt.user },
  ];
};

/**
 * True for Groq "request too large" / rate-limit responses (429 quota or 413
 * over-budget). Both mean the request can't be served right now.
 */
export const isRateLimitError = (error: unknown): boolean => {
  const status = (error as { status?: number })?.status;
  return status === 429 || status === 413;
};

export const generateLLMResponse = async (
  prompt: string | ChatPrompt,
  options?: { fast?: boolean },
): Promise<string> => {
  const completion = await groq().chat.completions.create(
    {
      model: options?.fast ? FAST_MODEL : MODEL,
      messages: toMessages(prompt),
      temperature: 0.3,
      max_tokens: options?.fast ? FAST_MAX_TOKENS : ANSWER_MAX_TOKENS,
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  return completion.choices[0]?.message?.content || "";
};

export const streamLLMResponse = async (prompt: string | ChatPrompt) => {
  return groq().chat.completions.create(
    {
      model: MODEL,
      messages: toMessages(prompt),
      temperature: 0.3,
      max_tokens: ANSWER_MAX_TOKENS,
      stream: true,
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );
};
