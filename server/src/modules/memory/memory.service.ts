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

export const getRecentMessages = async (chatId: string, userId: string) => {
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
    take: 8,
  });
};
