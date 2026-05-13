import express from "express";

import { financialChatController } from "./retrieval.controller";

const router = express.Router();

router.post("/chat", financialChatController);

export default router;
