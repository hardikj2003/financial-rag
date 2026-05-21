import fs from "fs";
import { v4 as uuidv4 } from "uuid";

import { extractTextFromPDF } from "../../services/pdf.service";
import { generateEmbedding } from "../../services/embedding.service";
import { createSmartChunks } from "../../services/smartChunk.service";

import qdrantClient from "../qdrant/qdrant.client";
import prisma from "../../config/prisma";

export const ingestPDF = async (file: Express.Multer.File) => {
  const extractedText = await extractTextFromPDF(file.path);

  const chunks = createSmartChunks(extractedText);
  const document = await prisma.document.create({
    data: {
      fileName: file.originalname,
      chunksStored: chunks.length,
    },
  });

  const points = [];

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];

    const embedding = await generateEmbedding(chunk.text);

    points.push({
      id: uuidv4(),
      vector: embedding,
      payload: {
        documentId: document.id,
        text: chunk.text,
        documentName: file.originalname,
        chunkIndex: chunk.metadata.chunkIndex,
        sectionTitle: chunk.metadata.sectionTitle,
        parentId: chunk.metadata.parentId,
        parentText: chunk.metadata.parentText,
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
