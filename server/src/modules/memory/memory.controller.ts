import { Request, Response } from "express";

import { createChat } from "./memory.service";

export const createChatController = async (req: Request, res: Response) => {
  const chat = await createChat();

  return res.json({
    success: true,
    chat,
  });
};
