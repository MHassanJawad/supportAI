// Gemini-backed AI provider abstraction for embeddings and grounded generation.
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SourceReference } from "@supportai/shared";
import { env } from "../config/env";
import { AppError } from "../errors/app-error";

export interface AiProvider {
  embed(text: string): Promise<number[]>;
  generateAnswer(question: string, context: SourceReference[]): Promise<string>;
}

export class GeminiAiProvider implements AiProvider {
  private readonly client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  public async embed(text: string): Promise<number[]> {
    try {
      const model = this.client.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (_error) {
      throw new AppError("AI_PROVIDER_ERROR", "Gemini embedding request failed.", 502);
    }
  }

  public async generateAnswer(question: string, context: SourceReference[]): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: env.GEMINI_GENERATION_MODEL });
      const contextBlock = context
        .map((source, index) => `[${index + 1}] ${source.documentName}\n${source.excerpt}`)
        .join("\n\n");
      const prompt = buildRagPrompt(question, contextBlock);
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (_error) {
      throw new AppError("AI_PROVIDER_ERROR", "Gemini answer generation failed.", 502);
    }
  }
}

export function buildRagPrompt(question: string, contextBlock: string): string {
  return [
    "You are SupportAI, a careful customer support assistant.",
    "Answer only from the supplied business knowledge base context.",
    "If the answer is not present, say you do not have enough information and suggest contacting support.",
    "Do not invent policies, prices, guarantees, or operational details.",
    "",
    `Question: ${question}`,
    "",
    `Knowledge base context:\n${contextBlock || "No relevant context was found."}`,
    "",
    "Answer in a concise, helpful tone."
  ].join("\n");
}

export const aiProvider = new GeminiAiProvider();
