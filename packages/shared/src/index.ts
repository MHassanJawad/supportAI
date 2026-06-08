// Shared contracts and validation schemas for SupportAI.
import { z } from "zod";

export const senderSchema = z.enum(["customer", "assistant", "owner", "system"]);
export const documentStatusSchema = z.enum(["uploaded", "processing", "ready", "failed"]);
export const businessRoleSchema = z.enum(["owner", "admin", "member"]);

export const uuidSchema = z.string().uuid();

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(120),
  industry: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(240)
});

export const createFaqSchema = z.object({
  question: z.string().trim().min(3).max(500),
  answer: z.string().trim().min(3).max(5000)
});

export const updateFaqSchema = createFaqSchema.partial().refine(
  (value) => value.question !== undefined || value.answer !== undefined,
  "At least one FAQ field must be provided."
);

export const createConversationSchema = z.object({
  customerId: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(160).optional()
});

export const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000)
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type BusinessRole = z.infer<typeof businessRoleSchema>;
export type Sender = z.infer<typeof senderSchema>;

export type ApiErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "AUTHORIZATION_FAILED"
  | "VALIDATION_ERROR"
  | "RESOURCE_NOT_FOUND"
  | "RATE_LIMITED"
  | "UPLOAD_REJECTED"
  | "AI_PROVIDER_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    requestId: string;
  };
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  chunkId: string;
  score: number;
  excerpt: string;
}

export interface ChatAnswer {
  conversationId: string;
  messageId: string;
  answer: string;
  sources: SourceReference[];
}
