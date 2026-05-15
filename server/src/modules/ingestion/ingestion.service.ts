import fs from "fs";
import { v4 as uuidv4 } from "uuid";

import { extractTextFromPDF } from "../../services/pdf.service";
import { splitTextIntoChunks } from "../../services/chunk.service";
import { generateEmbedding } from "../../services/embedding.service";

import qdrantClient from "../qdrant/qdrant.client";

export const ingestPDF = async (file: Express.Multer.File) => {
  const extractedText = await extractTextFromPDF(file.path);

  const chunks = await splitTextIntoChunks(extractedText);

  const points = [];

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];

    const embedding = await generateEmbedding(chunk);

    points.push({
      id: uuidv4(),

      vector: embedding,

      payload: {
        text: chunk,
        documentName: file.originalname,

        chunkIndex: index + 1,

        uploadedAt: new Date().toISOString(),
      },
    });
  }

  await qdrantClient.upsert("financial_docs", {
    wait: true,

    points,
  });

  fs.unlinkSync(file.path);

  return {
    success: true,

    chunksStored: chunks.length,
  };
};
