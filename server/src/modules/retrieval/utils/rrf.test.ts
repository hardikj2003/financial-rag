import { describe, it, expect } from "vitest";
import { reciprocalRankFusion } from "./rrf";
import { deduplicateChunks } from "./deduplicate";
import { RetrievedChunk } from "../types/retrieval.types";

const chunk = (id: string, score = 0): RetrievedChunk => ({
  id,
  text: `text-${id}`,
  documentName: "doc.pdf",
  chunkIndex: 0,
  score,
});

describe("reciprocalRankFusion", () => {
  it("ranks chunks appearing in multiple lists above single-list chunks", () => {
    const fused = reciprocalRankFusion([
      [chunk("a"), chunk("b")],
      [chunk("c"), chunk("a")],
    ]);

    expect(fused[0].id).toBe("a");
  });

  it("carries the fused score on the result (regression: score was discarded)", () => {
    const fused = reciprocalRankFusion([[chunk("a", 0.97)]]);

    // The raw source score (0.97 cosine) must be replaced by the RRF score.
    expect(fused[0].score).toBeCloseTo(1 / 61);
  });

  it("ignores incomparable input score scales entirely", () => {
    // "tables" list with huge raw scores must not dominate by magnitude.
    const fused = reciprocalRankFusion([
      [chunk("vec1", 0.9), chunk("vec2", 0.8)],
      [chunk("table", 100)],
    ]);

    const table = fused.find((c) => c.id === "table")!;
    const vec1 = fused.find((c) => c.id === "vec1")!;

    expect(table.score).toBeCloseTo(vec1.score);
  });
});

describe("deduplicateChunks", () => {
  it("dedupes by id keeping the highest score", () => {
    const result = deduplicateChunks([chunk("a", 1), chunk("a", 5), chunk("b", 2)]);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.id === "a")!.score).toBe(5);
  });

  it("does not collapse distinct tables (regression: name+index key)", () => {
    const t1 = { ...chunk("table-1", 1), documentName: "Financial Table" };
    const t2 = { ...chunk("table-2", 1), documentName: "Financial Table" };

    expect(deduplicateChunks([t1, t2])).toHaveLength(2);
  });
});
