import { pipeline } from "@xenova/transformers";

let extractor: any;

export const generateEmbedding = async (
  text: string
): Promise<number[]> => {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/bge-small-en-v1.5"
    );
  }

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
};