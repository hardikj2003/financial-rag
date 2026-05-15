import prisma from "../../config/prisma";

export const createChat = async () => {
  return prisma.chat.create({
    data: {},
  });
};

export const getAllChats = async () => {
  return prisma.chat.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getChatMessages = async (chatId: string) => {
  return prisma.message.findMany({
    where: {
      chatId,
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
