import prisma from "../../config/prisma";

export const createChat = async () => {
  const chat = await prisma.chat.create({
    data: {},
  });

  return chat;
};

export const storeMessage = async (
  chatId: string,
  role: string,
  content: string
) => {
  return prisma.message.create({
    data: {
      chatId,
      role,
      content,
    },
  });
};

export const getRecentMessages = async (
  chatId: string
) => {
  return prisma.message.findMany({
    where: {
      chatId,
    },

    orderBy: {
      createdAt: "asc",
    },

    take: 10,
  });
};