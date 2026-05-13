import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateLLMResponse = async (prompt: string) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",

    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],

    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || "";
};

export const streamLLMResponse = async (prompt: string) => {
  return groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",

    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],

    temperature: 0.3,

    stream: true,
  });
};
