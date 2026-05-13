import express from "express";

import { createChatController } from "./memory.controller";

const router = express.Router();

router.post("/create", createChatController);

export default router;
