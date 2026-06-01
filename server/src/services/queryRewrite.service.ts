import { RetrievalMemory } from "../modules/retrieval/types/retrieval.types";

export const rewriteQuery = async (
  query: string,
  memory?: RetrievalMemory,
): Promise<string> => {
  let rewritten = query;

  if (memory?.currentCompany) {
    const lower = query.toLowerCase();

    if (!lower.includes(memory.currentCompany.toLowerCase())) {
      rewritten = `${memory.currentCompany} ${query}`;
    }
  }

  return rewritten;
};
