// Business and membership persistence for SupportAI tenants.
import type { CreateBusinessInput } from "@supportai/shared";
import { supabaseAdmin } from "../config/supabase";
import { AppError, NotFoundError } from "../errors/app-error";

export async function createBusiness(input: CreateBusinessInput, userId: string) {
  const { data: existingMemberships, error: existingMembershipsError } = await supabaseAdmin
    .from("business_members")
    .select("businesses(id, name, industry, created_at)")
    .eq("user_id", userId);

  if (existingMembershipsError) {
    throw new AppError("DATABASE_ERROR", "Could not check existing businesses.", 500);
  }

  const normalizedName = input.name.trim().toLowerCase();
  const duplicateBusiness = (existingMemberships ?? []).find((membership) => {
    const business = getJoinedBusiness(membership);
    return business?.name.trim().toLowerCase() === normalizedName;
  });

  if (duplicateBusiness) {
    throw new AppError("VALIDATION_ERROR", "You already have a business with this name.", 409);
  }

  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .insert({ name: input.name, industry: input.industry })
    .select("*")
    .single();

  if (error || !business) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Supabase business insert failed",
        supabaseError: toSafeSupabaseError(error)
      })
    );
    throw new AppError("DATABASE_ERROR", getBusinessCreateMessage(error), 500);
  }

  const { error: memberError } = await supabaseAdmin.from("business_members").insert({
    business_id: business.id,
    user_id: userId,
    role: "owner"
  });

  if (memberError) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Supabase business membership insert failed",
        businessId: business.id,
        userId,
        supabaseError: toSafeSupabaseError(memberError)
      })
    );
    throw new AppError("DATABASE_ERROR", getMembershipCreateMessage(memberError), 500);
  }

  return business;
}

function getJoinedBusiness(membership: unknown): { id: string; name: string; industry: string; created_at: string } | null {
  if (!membership || typeof membership !== "object" || !("businesses" in membership)) {
    return null;
  }

  const business = (membership as { businesses?: unknown }).businesses;

  if (!business || Array.isArray(business) || typeof business !== "object" || !("name" in business)) {
    return null;
  }

  return business as { id: string; name: string; industry: string; created_at: string };
}

function getBusinessCreateMessage(error: unknown): string {
  const message = getSupabaseMessage(error);

  if (message.includes("row-level security")) {
    return "Could not create business because Supabase RLS blocked the insert. Check SUPABASE_SERVICE_ROLE_KEY and restart the API.";
  }

  if (message.includes("relation") && message.includes("does not exist")) {
    return "Could not create business because the Supabase tables are missing. Run db/migrations/001_initial_schema.sql.";
  }

  return "Could not create business. Check the API log for the Supabase error code.";
}

function getMembershipCreateMessage(error: unknown): string {
  const message = getSupabaseMessage(error);

  if (message.includes("violates foreign key constraint")) {
    return "Could not create business membership because the authenticated user was not found in Supabase Auth.";
  }

  if (message.includes("row-level security")) {
    return "Could not create business membership because Supabase RLS blocked the insert. Check SUPABASE_SERVICE_ROLE_KEY and restart the API.";
  }

  return "Could not create business membership. Check the API log for the Supabase error code.";
}

function getSupabaseMessage(error: unknown): string {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return "";
  }

  return String(error.message).toLowerCase();
}

function toSafeSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string };

  return {
    code: candidate.code,
    message: candidate.message,
    details: candidate.details,
    hint: candidate.hint
  };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("business_members")
    .select("role, businesses(id, name, industry, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError("DATABASE_ERROR", "Could not load profile.", 500);
  }

  return { userId, memberships: data };
}

export function requireBusinessId(businessId?: string): string {
  if (!businessId) {
    throw new NotFoundError("Create or join a business before using this endpoint.");
  }

  return businessId;
}
