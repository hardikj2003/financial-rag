import express from "express";

import upload from "../middleware/upload.middleware";
import { uploadPDFController } from "../controllers/ingestion.controller";

const router = express.Router();

router.post(
  "/upload",
  upload.single("pdf"),
  uploadPDFController
);

export default router;