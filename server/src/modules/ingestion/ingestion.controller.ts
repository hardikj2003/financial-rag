import { Request, Response } from "express";
import { ingestPDF } from "./ingestion.service";

export const uploadPDFController = async (
  req: Request,
  res: Response
) => {
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
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "PDF ingestion failed",
    });
  }
};