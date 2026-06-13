import prisma from "../../config/prisma";

export const DEFAULT_CHAT_TITLE = "New Financial Chat";

export const createChat = async (userId: string) => {
  return prisma.chat.create({
    data: {
      userId,
    },
  });
};

export const getAllChats = async (userId: string) => {
  return prisma.chat.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getChatMessages = async (chatId: string, userId: string) => {
  return prisma.message.findMany({
    where: {
      chatId,
      chat: {
        userId,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const getChatForUser = async (chatId: string, userId: string) => {
  return prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
  });
};

export const updateChatTitle = async (
  chatId: string,
  userId: string,
  title: string,
) => {
  return prisma.chat.updateMany({
    where: {
      id: chatId,
      userId,
    },
    data: {
      title,
    },
  });
};

export const storeMessage = async (
  chatId: string,
  role: "user" | "assistant",
  content: string,
) => {
  return prisma.message.create({
    data: {
      chatId,
      role,
      content,
    },
  });
};

/**
 * Returns the LAST `limit` messages in chronological order. The previous
 * implementation ordered ascending with `take`, which returned the FIRST
 * messages of the chat — freezing query rewriting and memory extraction on
 * the conversation's opening once it grew past the window.
 */
export const getRecentMessages = async (
  chatId: string,
  userId: string,
  limit = 8,
) => {
  const messages = await prisma.message.findMany({
    where: {
      chatId,
      chat: {
        userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return messages.reverse();
};
