import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const splitTextIntoChunks = async (text: string) => {
  const cleanedText = text
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1200,

    chunkOverlap: 200,

    separators: ["\n\n", "\n", ". ", " "],
  });

  const chunks = await splitter.createDocuments([cleanedText]);

  return chunks.map((chunk) => chunk.pageContent);
};
