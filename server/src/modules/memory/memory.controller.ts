import { logger } from "../../config/logger";
import { Request, Response } from "express";
import { createChat, getAllChats, getChatMessages } from "./memory.service";
import { ensureUserExists } from "../auth/auth.service";

export const createChatController = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }
    await ensureUserExists(req.userId!);
    const chat = await createChat(req.userId);

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    logger.error("request failed", error);

    res.status(500).json({
      success: false,
    });
  }
};

export const getChatsController = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const chats = await getAllChats(req.userId);
    res.json({
      success: true,
      chats,
    });
  } catch (error) {
    logger.error("request failed", error);
    res.status(500).json({
      success: false,
    });
  }
};

export const getChatMessagesController = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const chatId = req.params.chatId as string;
    const messages = await getChatMessages(chatId, req.userId);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    logger.error("request failed", error);

    res.status(500).json({
      success: false,
    });
  }
};
