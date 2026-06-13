import { logger } from "../config/logger";
import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    next();
  } catch (error) {
    logger.error("request failed", error);

    res.status(500).json({
      success: false,
    });
  }
};

