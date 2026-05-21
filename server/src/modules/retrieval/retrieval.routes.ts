import express from "express";

import { financialChatController } from "./retrieval.controller";
import { protectRoute } from "../../middleware/helper.middleware";

const router = express.Router();

router.post("/chat", protectRoute, financialChatController);

export default router;
