import express from "express";
import {
  createChatController,
  getChatsController,
  getChatMessagesController,
} from "./memory.controller";
import { protectRoute } from "../../middleware/helper.middleware";

const router = express.Router();

router.post("/create", protectRoute, createChatController);
router.get("/chats",protectRoute, getChatsController);
router.get("/chat/:chatId",protectRoute, getChatMessagesController);

export default router;
