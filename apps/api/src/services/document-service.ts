// Document upload, extraction, chunking, embedding, and tenant-scoped retrieval.
import path from "node:path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type { SourceReference } from "@supportai/shared";
import { env } from "../config/env";
import { supabaseAdmin } from "../config/supabase";
import { AppError, NotFoundError, ValidationError } from "../errors/app-error";
import { aiProvider } from "./ai-provider";
import { chunkText } from "./text-chunker";

const allowedMimeTypes = new Set(["application/pdf", "text/plain"]);

export async function uploadAndProcessDocument(file: Express.Multer.File, businessId: string) {
  assertAllowedFile(file);
  const safeName = sanitizeFilename(file.originalname);
  const storagePath = `${businessId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

  if (uploadError) {
    throw new AppError("UPLOAD_REJECTED", "Could not upload document to storage.", 400);
  }

  const { data: document, error: documentError } = await supabaseAdmin
    .from("documents")
    .insert({
      business_id: businessId,
      filename: safeName,
      mime_type: file.mimetype,
      storage_path: storagePath,
      status: "processing"
    })
    .select("*")
    .single();

  if (documentError || !document) {
    throw new AppError("DATABASE_ERROR", "Could not create document record.", 500);
  }

  try {
    const text = await extractText(file);
    const chunks = chunkText(text);

    for (const [index, chunk] of chunks.entries()) {
      const embedding = await aiProvider.embed(chunk.content);
      await supabaseAdmin.from("document_chunks").insert({
        business_id: businessId,
        document_id: document.id,
        chunk_text: chunk.content,
        embedding,
        chunk_index: index,
        token_estimate: chunk.tokenEstimate
      });
    }

    await supabaseAdmin.from("documents").update({ status: "ready" }).eq("id", document.id);
  } catch (error) {
    await supabaseAdmin.from("documents").update({ status: "failed" }).eq("id", document.id);
    throw error;
  }

  return document;
}

export async function listDocuments(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("DATABASE_ERROR", "Could not list documents.", 500);
  }

  return data;
}

export async function deleteDocument(documentId: string, businessId: string): Promise<void> {
  const { data: document } = await supabaseAdmin
    .from("documents")
    .select("id, storage_path")
    .eq("id", documentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!document) {
    throw new NotFoundError("Document was not found.");
  }

  await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([document.storage_path]);
  await supabaseAdmin.from("documents").delete().eq("id", documentId).eq("business_id", businessId);
}

export async function retrieveRelevantChunks(
  businessId: string,
  question: string,
  limit = 5
): Promise<SourceReference[]> {
  const embedding = await aiProvider.embed(question);
  const { data, error } = await supabaseAdmin.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_business_id: businessId,
    match_count: limit
  });

  if (error) {
    throw new AppError("DATABASE_ERROR", "Could not retrieve relevant knowledge base chunks.", 500);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    documentId: String(row.document_id),
    documentName: String(row.filename),
    chunkId: String(row.id),
    score: Number(row.similarity),
    excerpt: String(row.chunk_text)
  }));
}

function assertAllowedFile(file: Express.Multer.File): void {
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new ValidationError("Only PDF and TXT uploads are supported.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new ValidationError("Documents must be 10 MB or smaller.");
  }
}

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!base || base.includes("..")) {
    throw new ValidationError("Filename is invalid.");
  }

  return base;
}

async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf8");
  }

  const parsed = await pdfParse(file.buffer);
  return parsed.text;
}
