import express from "express";

import { getDocumentsController } from "./documents.controller";
import { protectRoute } from "../../middleware/helper.middleware";
import { requireAdmin } from "../auth/auth.service";

const router = express.Router();

router.get("/", protectRoute, requireAdmin, getDocumentsController);

export default router;
