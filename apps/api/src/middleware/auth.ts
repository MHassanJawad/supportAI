// Supabase JWT authentication and active business resolution middleware.
import type { NextFunction, Response } from "express";
import { AuthError } from "../errors/app-error";
import { supabaseAdmin, supabaseAuth } from "../config/supabase";
import type { Request } from "express";
import "../types";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    next(new AuthError());
    return;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    next(new AuthError("Invalid or expired session."));
    return;
  }

  const { data: membership } = await supabaseAdmin
    .from("business_members")
    .select("business_id")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  req.context.auth = {
    userId: data.user.id,
    ...(data.user.email ? { email: data.user.email } : {}),
    ...(membership?.business_id ? { businessId: membership.business_id as string } : {})
  };

  next();
}
