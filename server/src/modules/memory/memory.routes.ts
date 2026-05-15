import express from "express";
import {
  createChatController,
  getChatsController,
  getChatMessagesController,
} from "./memory.controller";

const router = express.Router();

router.post("/create", createChatController);
router.get("/chats", getChatsController);
router.get("/chat/:chatId", getChatMessagesController);

export default router;
