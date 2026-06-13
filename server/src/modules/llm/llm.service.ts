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

const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 60_000;

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

export const generateLLMResponse = async (
  prompt: string | ChatPrompt,
): Promise<string> => {
  const completion = await groq().chat.completions.create(
    {
      model: MODEL,
      messages: toMessages(prompt),
      temperature: 0.3,
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
      stream: true,
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );
};
