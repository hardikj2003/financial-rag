import { vectorSearch } from "./vector.search";
import { keywordSearch } from "./keyword.search";
import { deduplicateChunks } from "../utils/deduplicate";
import { RetrievalMemory, RetrievedChunk } from "../types/retrieval.types";
import { rerankChunks } from "./reranker";
import { applyMetadataBoost } from "../utils/metadataBoost";
import { expandToParentContexts } from "../../../services/parentExpansion.service";
import { detectSectionIntent } from "../utils/detectSectionIntent";
import { metadataSearch } from "./metadata.search";
import { reciprocalRankFusion } from "../utils/rrf";
import { detectTableIntent } from "../utils/detectTableIntent";
import { tableSearch } from "./table.search";

export const hybridSearch = async (
  query: string,
  memory?: RetrievalMemory,
): Promise<RetrievedChunk[]> => {
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query),
    keywordSearch(query),
  ]);

  const sectionIntent = detectSectionIntent(query);
  const wantsTables = detectTableIntent(query);
  let metadataResults: RetrievedChunk[] = [];
  let formattedTables: RetrievedChunk[] = [];

  // -----------------------------
  // Table Retrieval
  // -----------------------------

  if (wantsTables) {
    const tableResults = await tableSearch(query);
    console.log("TABLE SEARCH ENABLED");
    console.log("TABLE RESULTS:", tableResults.length);
    formattedTables = tableResults.map((table) => ({
      id: table.id,
      text: JSON.stringify(table.rows).slice(0, 1000),
      score: table.score,
      documentName: "Financial Table",
      chunkIndex: 0,
      sectionTitle: table.tableName || "Financial Table",
      metadata: {},
      companyName: undefined,
    }));
  }

  // -----------------------------
  // Metadata Search
  // -----------------------------

  if (sectionIntent) {
    metadataResults = await metadataSearch(sectionIntent);
    console.log("SECTION FILTER:", sectionIntent);
  }

  // -----------------------------
  // Reciprocal Rank Fusion
  // -----------------------------

  const fusedResults = reciprocalRankFusion([
    formattedTables,
    metadataResults,
    vectorResults,
    keywordResults,
  ]);

  // -----------------------------
  // Deduplication
  // -----------------------------

  const deduplicated = deduplicateChunks(fusedResults);

  // -----------------------------
  // Metadata Boosting
  // -----------------------------

  let boosted = applyMetadataBoost(query, deduplicated);

  // -----------------------------
  // Company-Aware Boosting
  // -----------------------------

  if (memory?.currentCompany) {
    boosted = boosted.map((chunk) => ({
      ...chunk,
      score:
        chunk.companyName === memory.currentCompany
          ? chunk.score + 20
          : chunk.score,
    }));
  }

  // -----------------------------
  // Conversational Topic Boosting
  // -----------------------------

  if (memory?.recentTopics?.length) {
    boosted = boosted.map((chunk) => {
      let score = chunk.score;
      const section = (chunk.sectionTitle || "").toLowerCase();
      for (const topic of memory.recentTopics) {
        if (section.includes(topic.toLowerCase())) {
          score += 15;
        }
      }

      return {
        ...chunk,
        score,
      };
    });
  }

  // -----------------------------
  // Reranking
  // -----------------------------

  const reranked = rerankChunks(query, boosted);

  // -----------------------------
  // Parent Expansion
  // -----------------------------

  const expanded = expandToParentContexts(reranked);
  console.log("FINAL RETRIEVAL COUNT:", expanded.length);
  return reranked.slice(0, 8);
};
