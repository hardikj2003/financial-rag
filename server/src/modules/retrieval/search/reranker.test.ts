import { describe, it, expect } from "vitest";
import { rerankChunks } from "./reranker";
import { RetrievedChunk } from "../types/retrieval.types";

const chunk = (
  id: string,
  score: number,
  text: string,
): RetrievedChunk => ({
  id,
  text,
  documentName: "doc.pdf",
  chunkIndex: 0,
  score,
});

const longText = (lead: string) =>
  `${lead} ${"filler words to make this chunk long enough to avoid the quality penalty applied to short fragments. ".repeat(3)}`;

describe("rerankChunks", () => {
  it("actually changes ranking based on query coverage", () => {
    const chunks = [
      chunk("irrelevant", 1.0, longText("unrelated narrative content")),
      chunk("relevant", 0.95, longText("revenue growth and ebitda margin details")),
    ];

    const reranked = rerankChunks("revenue growth ebitda margin", chunks);

    expect(reranked[0].id).toBe("relevant");
  });

  it("returns scores on a 0..100 scale", () => {
    const reranked = rerankChunks("revenue", [
      chunk("a", 0.5, longText("revenue details")),
    ]);

    expect(reranked[0].score).toBeGreaterThanOrEqual(0);
    expect(reranked[0].score).toBeLessThanOrEqual(100);
  });

  it("penalizes tiny fragments", () => {
    const reranked = rerankChunks("revenue", [
      chunk("tiny", 1.0, "revenue"),
      chunk("full", 1.0, longText("revenue analysis")),
    ]);

    expect(reranked[0].id).toBe("full");
  });

  it("handles empty input", () => {
    expect(rerankChunks("query", [])).toEqual([]);
  });
});
