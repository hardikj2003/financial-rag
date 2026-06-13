import { logger } from "../../config/logger";
import { Request, Response } from "express";

import prisma from "../../config/prisma";

export const getDocumentsController = async (req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      documents,
    });
  } catch (error) {
    logger.error("request failed", error);

    res.status(500).json({
      success: false,
    });
  }
};

