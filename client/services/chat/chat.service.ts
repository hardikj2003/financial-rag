import api from "../api/api";

export const createChat = async () => {
  const response = await api.post("/memory/create");
  return response.data;
};

export const streamMessage = async (
  query: string,
  chatId: string,
  onToken: (token: string) => void,
  onDone: (sources: any[]) => void,
) => {
  const response = await fetch("http://localhost:8000/api/retrieval/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, chatId }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  // This buffer persists partial lines across stream reads
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Append current network chunk to buffer
    buffer += decoder.decode(value, { stream: true });

    // Split the buffer by lines
    const lines = buffer.split("\n");

    // Save the last element (it's either empty or an incomplete line) back to the buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

      try {
        // Strip out the data prefix safely
        const rawJson = trimmedLine.replace(/^data:\s*/, "");
        const parsed = JSON.parse(rawJson);

        if (parsed.done) {
          onDone(parsed.sources || []);
          return;
        }

        if (typeof parsed.token === "string") {
          if (parsed.token) {
            onToken(parsed.token);
          }
        }
      } catch (err) {
        // Catch parsing errors quietly for partial trailing lines
        console.warn("Failed to parse SSE line chunk:", trimmedLine, err);
      }
    }
  }
};

export const getChats = async () => {
  const response = await api.get("/memory/chats");

  return response.data;
};

export const getChatMessages = async (chatId: string) => {
  const response = await api.get(`/memory/chat/${chatId}`);

  return response.data;
};
