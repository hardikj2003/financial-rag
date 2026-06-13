import { describe, it, expect } from "vitest";
import { parseVerdict } from "./answerVerification.service";

describe("parseVerdict", () => {
  it("passes supported answers", () => {
    expect(parseVerdict("SUPPORTED")).toBe("SUPPORTED");
    expect(parseVerdict("  supported  ")).toBe("SUPPORTED");
  });

  it("fails unsupported answers (regression: 'UNSUPPORTED'.includes('SUPPORTED') === true)", () => {
    expect(parseVerdict("UNSUPPORTED")).toBe("UNSUPPORTED");
    expect(parseVerdict("The answer is UNSUPPORTED.")).toBe("UNSUPPORTED");
  });

  it("returns UNKNOWN for anything else", () => {
    expect(parseVerdict("I cannot determine this")).toBe("UNKNOWN");
    expect(parseVerdict("")).toBe("UNKNOWN");
  });
});
