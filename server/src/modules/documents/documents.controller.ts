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
    console.error(error);

    res.status(500).json({
      success: false,
    });
  }
};

export const deleteDocumentController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.document.delete({
      where: { id },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
    });
  }
};
