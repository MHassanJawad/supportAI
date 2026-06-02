// Unit tests for document text chunking.
import { describe, expect, it } from "vitest";
import { chunkText, normalizeText } from "../src/services/text-chunker";

describe("text chunker", () => {
  it("should normalize repeated whitespace when text contains noisy spacing", () => {
    expect(normalizeText("Hello   world\r\n\r\n\r\nPolicy")).toBe("Hello world\n\nPolicy");
  });

  it("should return no chunks when text is empty", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("should split long content into overlapping chunks", () => {
    const chunks = chunkText("a".repeat(2500), 1000, 100);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.content.length).toBeLessThanOrEqual(1000);
  });
});
