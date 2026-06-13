import { readFile } from "fs/promises";
import pdfParse from "pdf-parse";

const PDF_MAGIC = "%PDF-";

/**
 * Reads asynchronously (the previous readFileSync blocked the event loop on
 * 25MB uploads) and validates the PDF magic bytes — the multer fileFilter
 * only checks the client-supplied mimetype, which is trivially spoofable.
 */
export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  const dataBuffer = await readFile(filePath);

  if (!dataBuffer.subarray(0, 5).toString("latin1").startsWith(PDF_MAGIC)) {
    throw new Error("File is not a valid PDF");
  }

  const pdfData = await pdfParse(dataBuffer);

  return pdfData.text;
};
