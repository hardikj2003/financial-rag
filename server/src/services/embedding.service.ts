import { pipeline } from "@xenova/transformers";

type FeatureExtractor = (
  texts: string | string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array; dims: number[] }>;

let extractorPromise: Promise<FeatureExtractor> | undefined;

const getExtractor = () => {
  // Memoize the promise (not the result) so concurrent first calls don't
  // load the model twice.
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      "Xenova/bge-small-en-v1.5",
    ) as unknown as Promise<FeatureExtractor>;
  }

  return extractorPromise;
};

/**
 * BGE models are trained with an instruction prefix on the QUERY side only.
 * Omitting it measurably hurts retrieval quality.
 */
const BGE_QUERY_PREFIX =
  "Represent this sentence for searching relevant passages: ";

export const generateQueryEmbedding = async (
  query: string,
): Promise<number[]> => {
  const extractor = await getExtractor();

  const output = await extractor(BGE_QUERY_PREFIX + query, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
};

/**
 * Batched passage embedding for ingestion. The previous implementation
 * embedded one chunk at a time in a sequential loop.
 */
export const generatePassageEmbeddings = async (
  texts: string[],
  batchSize = 16,
): Promise<number[][]> => {
  const extractor = await getExtractor();
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const output = await extractor(batch, {
      pooling: "mean",
      normalize: true,
    });

    const [rows, dim] = output.dims;
    for (let row = 0; row < rows; row++) {
      embeddings.push(Array.from(output.data.slice(row * dim, (row + 1) * dim)));
    }
  }

  return embeddings;
};
