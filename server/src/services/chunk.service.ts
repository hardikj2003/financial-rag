import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const chunkText = async (text: string) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.createDocuments([text]);

  return chunks;
};