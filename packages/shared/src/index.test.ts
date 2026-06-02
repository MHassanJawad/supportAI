// Tests for shared SupportAI validation contracts.
import { describe, expect, it } from "vitest";
import { createFaqSchema, createMessageSchema, paginationSchema } from "./index";

describe("shared schemas", () => {
  it("should accept a valid FAQ when question and answer are present", () => {
    const parsed = createFaqSchema.parse({
      question: "What is your refund policy?",
      answer: "Refunds are available within 14 days."
    });

    expect(parsed.question).toBe("What is your refund policy?");
  });

  it("should reject an empty chat message when content is blank", () => {
    expect(() => createMessageSchema.parse({ content: "   " })).toThrow();
  });

  it("should default pagination when query values are omitted", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });
});
