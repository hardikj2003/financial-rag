import prisma from "../../config/prisma";
import qdrantClient from "../qdrant/qdrant.client";

export const getDashboardMetrics = async () => {
  const [totalUsers, totalChats, totalMessages, totalDocuments] =
    await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.document.count(),
    ]);
  const chunkStats = await prisma.document.aggregate({
    _sum: {
      chunksStored: true,
    },
  });

  return {
    totalUsers,
    totalChats,
    totalMessages,
    totalDocuments,
    totalChunks: chunkStats._sum.chunksStored ?? 0,
  };
};

export const getDocumentsInventory = async () => {
  return prisma.document.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const deleteDocument = async (documentId: string) => {
  await qdrantClient.delete("financial_docs", {
    filter: {
      must: [
        {
          key: "documentId",
          match: {
            value: documentId,
          },
        },
      ],
    },
  });

  return prisma.document.delete({
    where: {
      id: documentId,
    },
  });
};
