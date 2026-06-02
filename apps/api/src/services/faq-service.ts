// FAQ management services scoped to the active business tenant.
import type { CreateFaqInput, UpdateFaqInput } from "@supportai/shared";
import { supabaseAdmin } from "../config/supabase";
import { AppError, NotFoundError } from "../errors/app-error";

export async function listFaqs(businessId: string) {
  const { data, error } = await supabaseAdmin.from("faqs").select("*").eq("business_id", businessId);

  if (error) {
    throw new AppError("DATABASE_ERROR", "Could not list FAQs.", 500);
  }

  return data;
}

export async function createFaq(input: CreateFaqInput, businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("faqs")
    .insert({ business_id: businessId, question: input.question, answer: input.answer })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("DATABASE_ERROR", "Could not create FAQ.", 500);
  }

  return data;
}

export async function updateFaq(faqId: string, input: UpdateFaqInput, businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("faqs")
    .update(input)
    .eq("id", faqId)
    .eq("business_id", businessId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError("DATABASE_ERROR", "Could not update FAQ.", 500);
  }

  if (!data) {
    throw new NotFoundError("FAQ was not found.");
  }

  return data;
}

export async function deleteFaq(faqId: string, businessId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("faqs").delete().eq("id", faqId).eq("business_id", businessId);

  if (error) {
    throw new AppError("DATABASE_ERROR", "Could not delete FAQ.", 500);
  }
}
