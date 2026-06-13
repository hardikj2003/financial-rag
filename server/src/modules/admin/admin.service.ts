import prisma from "../../config/prisma";
import qdrantClient from "../qdrant/qdrant.client";
import { FINANCIAL_COLLECTION } from "../qdrant/qdrant.service";
import { logger } from "../../config/logger";

export const getDashboardMetrics = async () => {
  const [totalUsers, totalChats, totalMessages, totalDocuments, chunkStats] =
    await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.document.count(),
      prisma.document.aggregate({
        _sum: {
          chunksStored: true,
        },
      }),
    ]);

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

/**
 * Postgres first, then Qdrant. If the vector delete fails the document is
 * already gone from the app (orphan vectors are unreachable and cleanable),
 * whereas the previous order could leave a visible document whose content
 * had been destroyed.
 */
export const deleteDocument = async (documentId: string) => {
  const deleted = await prisma.document.delete({
    where: {
      id: documentId,
    },
  });

  try {
    await qdrantClient.delete(FINANCIAL_COLLECTION, {
      filter: {
        must: [{ key: "documentId", match: { value: documentId } }],
      },
    });
  } catch (error) {
    logger.error("qdrant cleanup failed after document delete", error, {
      documentId,
    });
  }

  return deleted;
};
