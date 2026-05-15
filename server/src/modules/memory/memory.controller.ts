import { Request, Response } from "express";
import { createChat, getAllChats, getChatMessages } from "./memory.service";

export const createChatController = async (req: Request, res: Response) => {
  try {
    const chat = await createChat();

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
    });
  }
};

export const getChatsController = async (req: Request, res: Response) => {
  try {
    const chats = await getAllChats();

    res.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error(error);
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
    const chatId = req.params.chatId as string;
    const messages = await getChatMessages(chatId);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
    });
  }
};
