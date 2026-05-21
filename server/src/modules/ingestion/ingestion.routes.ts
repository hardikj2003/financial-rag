import express from "express";

import upload from "../../middleware/upload.middleware";
import { uploadPDFController } from "./ingestion.controller";
import { protectRoute } from "../../middleware/helper.middleware";
import { requireAdmin } from "../auth/auth.service";

const router = express.Router();

router.post(
  "/upload",
  protectRoute,
  requireAdmin,
  upload.single("pdf"),
  uploadPDFController
);

export default router
