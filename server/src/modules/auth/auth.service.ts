import { NextFunction, Request, Response } from "express";
import prisma from "../../config/prisma";

export const ensureUserExists = async (userId: string) => {
  const existing = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      id: userId,
    },
  });
};

export const requireAdmin = async (req: Request, res:Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
    });
  }

  next();
};
