// Gemini-backed AI provider abstraction for embeddings and grounded generation.
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SourceReference } from "@supportai/shared";
import { env } from "../config/env";
import { AppError } from "../errors/app-error";

export interface AiProvider {
  embed(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY", title?: string): Promise<number[]>;
  generateAnswer(question: string, context: SourceReference[]): Promise<string>;
}

export class GeminiAiProvider implements AiProvider {
  private readonly client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  public async embed(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY", title?: string): Promise<number[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_EMBEDDING_MODEL}:embedContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            content: {
              parts: [{ text }]
            },
            embedContentConfig: {
              ...(title ? { title } : {}),
              taskType,
              outputDimensionality: env.GEMINI_EMBEDDING_DIMENSIONS
            }
          })
        }
      );

      const payload = (await response.json()) as {
        embedding?: { values?: number[] };
        error?: { message?: string; status?: string; code?: number };
      };

      if (!response.ok || !payload.embedding?.values) {
        throw new Error(payload.error?.message ?? `Gemini embedding HTTP ${response.status}`);
      }

      const values = payload.embedding.values;

      if (values.length < env.GEMINI_EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Gemini returned ${values.length} embedding dimensions, expected ${env.GEMINI_EMBEDDING_DIMENSIONS}.`
        );
      }

      return values.slice(0, env.GEMINI_EMBEDDING_DIMENSIONS);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Gemini embedding request failed",
          model: env.GEMINI_EMBEDDING_MODEL,
          taskType,
          providerError: toSafeProviderError(error)
        })
      );
      throw new AppError("AI_PROVIDER_ERROR", getGeminiEmbeddingMessage(error), 502);
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
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Gemini answer generation failed",
          model: env.GEMINI_GENERATION_MODEL,
          providerError: toSafeProviderError(error)
        })
      );
      throw new AppError("AI_PROVIDER_ERROR", getGeminiGenerationMessage(error), 502);
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

function getGeminiEmbeddingMessage(error: unknown): string {
  const message = getProviderMessage(error);

  if (message.includes("api key not valid") || message.includes("api_key_invalid") || message.includes("permission")) {
    return "Gemini embedding request failed because the API key is invalid or not allowed for this project.";
  }

  if (message.includes("not found") || message.includes("model")) {
    return `Gemini embedding request failed because model ${env.GEMINI_EMBEDDING_MODEL} is unavailable for this API key.`;
  }

  if (message.includes("quota") || message.includes("billing")) {
    return "Gemini embedding request failed because quota or billing is not available for this API key.";
  }

  return "Gemini embedding request failed. Check the API log for the Gemini error message.";
}

function getGeminiGenerationMessage(error: unknown): string {
  const message = getProviderMessage(error);

  if (message.includes("api key not valid") || message.includes("api_key_invalid") || message.includes("permission")) {
    return "Gemini answer generation failed because the API key is invalid or not allowed for this project.";
  }

  if (message.includes("not found") || message.includes("model")) {
    return `Gemini answer generation failed because model ${env.GEMINI_GENERATION_MODEL} is unavailable for this API key.`;
  }

  if (message.includes("quota") || message.includes("billing")) {
    return "Gemini answer generation failed because quota or billing is not available for this API key.";
  }

  return "Gemini answer generation failed. Check the API log for the Gemini error message.";
}

function getProviderMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }

  return String(error).toLowerCase();
}

function toSafeProviderError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return {
    message: String(error)
  };
}
