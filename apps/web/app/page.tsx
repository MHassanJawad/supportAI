// Auth-aware home page that renders the SupportAI product console.
"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthPanel } from "../components/AuthPanel";
import { Dashboard } from "../components/Dashboard";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => {
        setLoaded(true);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!loaded) {
    return <main className="p-6">Loading...</main>;
  }

  return session ? <Dashboard /> : <AuthPanel />;
}
