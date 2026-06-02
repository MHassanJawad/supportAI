// API client helpers that attach the Supabase bearer token.
import { supabase } from "./supabase";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "Request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
}
