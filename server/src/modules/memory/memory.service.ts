import prisma from "../../config/prisma";

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

export const updateChatTitle = async (chatId: string, title: string) => {
  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      title,
    },
  });
};

export const storeMessage = async (
  chatId: string,
  role: string,
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

export const getRecentMessages = async (chatId: string) => {
  return prisma.message.findMany({
    where: {
      chatId,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 8,
  });
};
