// Conversation and RAG answer orchestration for SupportAI chat.
import type { CreateConversationInput } from "@supportai/shared";
import { supabaseAdmin } from "../config/supabase";
import { AppError, NotFoundError } from "../errors/app-error";
import { aiProvider } from "./ai-provider";
import { retrieveRelevantChunks } from "./document-service";

export async function createConversation(input: CreateConversationInput, businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      business_id: businessId,
      customer_id: input.customerId ?? null,
      title: input.title ?? "New conversation"
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("DATABASE_ERROR", "Could not create conversation.", 500);
  }

  return data;
}

export async function listConversations(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("*, messages(id, sender, content, created_at)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("DATABASE_ERROR", "Could not list conversations.", 500);
  }

  return data;
}

export async function getConversation(conversationId: string, businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("*, messages(*)")
    .eq("id", conversationId)
    .eq("business_id", businessId)
    .order("created_at", { referencedTable: "messages", ascending: true })
    .maybeSingle();

  if (error) {
    throw new AppError("DATABASE_ERROR", "Could not load conversation.", 500);
  }

  if (!data) {
    throw new NotFoundError("Conversation was not found.");
  }

  return data;
}

export async function answerMessage(conversationId: string, businessId: string, content: string) {
  const startedAt = Date.now();
  await getConversation(conversationId, businessId);

  const { error: customerMessageError } = await supabaseAdmin.from("messages").insert({
    business_id: businessId,
    conversation_id: conversationId,
    sender: "customer",
    content
  });

  if (customerMessageError) {
    throw new AppError("DATABASE_ERROR", "Could not persist customer message.", 500);
  }

  const sources = await retrieveRelevantChunks(businessId, content);
  const answer = await aiProvider.generateAnswer(content, sources);

  const { data: assistantMessage, error: assistantMessageError } = await supabaseAdmin
    .from("messages")
    .insert({
      business_id: businessId,
      conversation_id: conversationId,
      sender: "assistant",
      content: answer,
      metadata: { sources }
    })
    .select("*")
    .single();

  if (assistantMessageError || !assistantMessage) {
    throw new AppError("DATABASE_ERROR", "Could not persist assistant message.", 500);
  }

  await supabaseAdmin.from("analytics_events").insert({
    business_id: businessId,
    event_name: "chat_answered",
    properties: {
      question: content,
      responseTimeMs: Date.now() - startedAt,
      sourceCount: sources.length
    }
  });

  return {
    conversationId,
    messageId: assistantMessage.id,
    answer,
    sources
  };
}
