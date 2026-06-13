import { describe, it, expect } from "vitest";
import { createSmartChunks } from "./smartChunk.service";

const paragraph = (topic: string) =>
  `${topic} performance this year was driven by multiple operating factors across segments, with management noting sustained demand, disciplined cost control, and continued investment in capacity expansion across all major business units during the period.`;

describe("createSmartChunks", () => {
  it("assigns section titles from heading lines", () => {
    const text = [
      "Risk Factors",
      "",
      paragraph("Regulatory"),
      "",
      paragraph("Competitive"),
    ].join("\n");

    const chunks = createSmartChunks(text);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata.sectionTitle).toBe("risk factors");
  });

  it("does not start a section from a keyword inside prose (regression)", () => {
    const text = [
      paragraph("General"),
      "",
      // Long prose line containing "revenue" — must NOT become a heading.
      `The discussion of revenue ${paragraph("trends")}`,
    ].join("\n");

    const chunks = createSmartChunks(text);

    expect(chunks.every((c) => c.metadata.sectionTitle === "general")).toBe(
      true,
    );
  });

  it("gives all children of a section the same complete parent text", () => {
    const paragraphs = Array.from({ length: 8 }, (_, i) =>
      paragraph(`Topic${i}`),
    );
    const text = ["Cash Flow", "", paragraphs.join("\n\n")].join("\n");

    const chunks = createSmartChunks(text);
    const parents = new Set(chunks.map((c) => c.metadata.parentText));

    expect(chunks.length).toBeGreaterThan(1);
    expect(parents.size).toBe(1);
  });

  it("drops page-number lines and junk fragments", () => {
    const text = ["page 12", "", "Short.", "", paragraph("Real")].join("\n");

    const chunks = createSmartChunks(text);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).not.toContain("page 12");
  });
});
