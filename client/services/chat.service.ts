import api from "./api";

export const createChat = async () => {
  const response = await api.post("/memory/create");

  return response.data;
};

export const streamMessage = async (
  query: string,
  chatId: string,
  onToken: (token: string) => void,
) => {
  const response = await fetch("http://localhost:8000/api/retrieval/chat", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      query,
      chatId,
    }),
  });

  const reader = response.body?.getReader();

  const decoder = new TextDecoder();

  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value);

    const lines = chunk.split("\n").filter((line) => line.startsWith("data:"));

    for (const line of lines) {
      const parsed = JSON.parse(line.replace("data: ", ""));

      if (parsed.done) {
        return;
      }

      onToken(parsed.token);
    }
  }
};
