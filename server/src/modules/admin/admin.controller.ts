import { logger } from "../../config/logger";
import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { deleteDocument, getDashboardMetrics, getDocumentsInventory } from "./admin.service";

export const adminMeController = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
  });

  res.json({
    isAdmin: user?.role === "ADMIN",
  });
};

export const dashboardMetricsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const metrics = await getDashboardMetrics();

    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    logger.error("request failed", error);

    res.status(500).json({
      success: false,
    });
  }
};

export const documentsController = async (req: Request, res: Response) => {
  const documents = await getDocumentsInventory();

  res.json({
    success: true,
    documents,
  });
};

export const deleteDocumentController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await deleteDocument(id);

    res.json({
      success: true,
    });
  } catch (error) {
    logger.error("request failed", error);

    res.status(500).json({
      success: false,
    });
  }
};
