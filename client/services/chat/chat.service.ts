import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { API_BASE_URL } from "@/services/api/api";
import { Source } from "@/store/chat/chat.store";

export const createChat = async (token: string) => {
  const apiClient = await authenticatedFetch(token);
  const response = await apiClient.post("/memory/create");

  return response.data;
};

export const streamMessage = async (
  token: string,
  query: string,
  chatId: string,
  onToken: (token: string) => void,
  onDone: (sources: Source[], verified: boolean) => void,
) => {
  const response = await fetch(`${API_BASE_URL}/retrieval/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      chatId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to stream response");
  }
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, {
      stream: true,
    });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith("data:")) {
        continue;
      }
      try {
        const rawJson = trimmedLine.replace(/^data:\s*/, "");
        const parsed = JSON.parse(rawJson) as {
          done?: boolean;
          sources?: Source[];
          verified?: boolean;
          token?: string;
        };
        if (parsed.done) {
          onDone(parsed.sources || [], parsed.verified ?? false);
          return;
        }
        if (typeof parsed.token === "string") {
          if (parsed.token) {
            onToken(parsed.token);
          }
        }
      } catch (err) {
        console.warn("Failed to parse SSE chunk:", trimmedLine, err);
      }
    }
  }
};

export const getChats = async (token: string) => {
  const apiClient = await authenticatedFetch(token);
  const response = await apiClient.get("/memory/chats");
  return response.data;
};

export const getChatMessages = async (chatId: string, token: string) => {
  const apiClient = await authenticatedFetch(token);
  const response = await apiClient.get(`/memory/chat/${chatId}`);
  return response.data;
};
