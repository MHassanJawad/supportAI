// Browser Supabase client for authentication sessions.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseConfigError(): string | null {
	if (!supabaseUrl || !supabaseAnonKey) {
		return "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for the web app.";
	}

	if (supabaseUrl.includes("your-project.supabase.co") || supabaseAnonKey.includes("replace-with-anon-key")) {
		return "Supabase placeholders are still in use. Replace NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY with real values.";
	}

	return null;
}

export const supabaseConfigError = getSupabaseConfigError();

// Keep module initialization safe; guarded usage shows config errors to users.
export const supabase = createClient(supabaseUrl ?? "https://invalid.local", supabaseAnonKey ?? "invalid-anon-key");
