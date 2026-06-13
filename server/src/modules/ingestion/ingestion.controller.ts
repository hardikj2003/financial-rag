import { Request, Response } from "express";
import { unlink } from "fs/promises";
import { ingestPDF } from "./ingestion.service";
import { logger } from "../../config/logger";

export const uploadPDFController = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const result = await ingestPDF(file);

    return res.json(result);
  } catch (error) {
    logger.error("pdf ingestion failed", error, {
      fileName: req.file?.originalname,
    });

    const message = error instanceof Error ? error.message : "";

    if (message.includes("already been ingested")) {
      return res.status(409).json({ success: false, error: message });
    }

    if (message.includes("not a valid PDF")) {
      return res.status(400).json({ success: false, error: message });
    }

    return res.status(500).json({
      success: false,
      error: "PDF ingestion failed",
    });
  } finally {
    if (req.file?.path) {
      await unlink(req.file.path).catch(() => {
        // Temp file already gone — nothing to clean up.
      });
    }
  }
};
