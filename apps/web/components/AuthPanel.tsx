// Role-aware authentication panel for Supabase email/password sessions.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, LogIn, ShieldCheck, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { supabase, supabaseConfigError } from "../lib/supabase";

type AuthRole = "business" | "customer";

export function AuthPanel({ role }: { role: AuthRole }) {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerCompany, setRegisterCompany] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = useMemo(
    () =>
      role === "business"
        ? {
            eyebrow: "Business access",
            heading: "Manage your AI support workspace.",
            body: "Upload documents, manage FAQs, inspect customer questions, and publish a support portal for your customers.",
            loginTitle: "Business login",
            registerTitle: "Register business",
            registerBody: "Create an owner account for a new business workspace.",
            redirectTo: "/business/dashboard" as const,
            alternateHref: "/customer/auth" as const,
            alternateLabel: "Customer login",
            icon: <Building2 className="h-5 w-5" />
          }
        : {
            eyebrow: "Customer access",
            heading: "Find answers from businesses you use.",
            body: "Use your customer dashboard to browse available support portals and ask questions from business knowledge bases.",
            loginTitle: "Customer login",
            registerTitle: "Register customer",
            registerBody: "Create a customer account for support access.",
            redirectTo: "/customer/dashboard" as const,
            alternateHref: "/business/auth" as const,
            alternateLabel: "Business login",
            icon: <Users className="h-5 w-5" />
          },
    [role]
  );

  useEffect(() => {
    if (supabaseConfigError) {
      setLoginMessage(supabaseConfigError);
      setRegisterMessage(supabaseConfigError);
    }
  }, []);

  async function submitLogin() {
    if (isSubmitting) {
      return;
    }

    const normalizedEmail = loginEmail.trim();
    if (!normalizedEmail || !loginPassword) {
      setLoginMessage("Enter your email and password.");
      return;
    }

    if (supabaseConfigError) {
      setLoginMessage(supabaseConfigError);
      return;
    }

    setLoginMessage("");
    setIsSubmitting(true);

    try {
      const result = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: loginPassword });

      if (result.error) {
        setLoginMessage(result.error.message);
        return;
      }

      router.push(copy.redirectTo);
    } catch {
      setLoginMessage("Unable to reach auth service. Verify Supabase URL/key and network connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitRegistration() {
    if (isSubmitting) {
      return;
    }

    const normalizedEmail = registerEmail.trim();
    if (!registerName.trim()) {
      setRegisterMessage("Enter your name.");
      return;
    }

    if (role === "business" && !registerCompany.trim()) {
      setRegisterMessage("Enter your business name.");
      return;
    }

    if (!normalizedEmail) {
      setRegisterMessage(role === "business" ? "Enter a work email address." : "Enter an email address.");
      return;
    }

    if (registerPassword.length < 8) {
      setRegisterMessage("Password must be at least 8 characters.");
      return;
    }

    if (registerPassword !== confirmPassword) {
      setRegisterMessage("Passwords do not match.");
      return;
    }

    if (supabaseConfigError) {
      setRegisterMessage(supabaseConfigError);
      return;
    }

    setRegisterMessage("");
    setIsSubmitting(true);

    try {
      const result = await supabase.auth.signUp({
        email: normalizedEmail,
        password: registerPassword,
        options: {
          data: {
            account_type: role,
            full_name: registerName.trim(),
            ...(role === "business" ? { company_name: registerCompany.trim() } : {})
          }
        }
      });

      if (result.error) {
        setRegisterMessage(result.error.message);
        return;
      }

      if (result.data.session) {
        router.push(copy.redirectTo);
        return;
      }

      setRegisterMessage("Account created. Check your email if confirmation is enabled.");
    } catch {
      setRegisterMessage("Unable to reach auth service. Verify Supabase URL/key and network connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-mist px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink" href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">{copy.eyebrow}</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">{copy.heading}</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">{copy.body}</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3 lg:grid-cols-1">
            <TrustItem icon={<ShieldCheck className="h-4 w-4" />} label="Secure Supabase sessions" />
            <TrustItem icon={copy.icon} label={role === "business" ? "Owner workspace" : "Customer dashboard"} />
            <Link className="rounded border border-line bg-white px-3 py-2 shadow-sm hover:bg-white/70" href={copy.alternateHref}>
              {copy.alternateLabel}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-line bg-white p-5 shadow-sm">
            <div className="mb-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-ink text-white">
                <LogIn className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-ink">{copy.loginTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">Access your existing account.</p>
            </div>
            <div className="space-y-3">
              <input
                className="w-full rounded border border-line px-3 py-2"
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="Email"
                type="email"
                value={loginEmail}
              />
              <input
                className="w-full rounded border border-line px-3 py-2"
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Password"
                type="password"
                value={loginPassword}
              />
              <button
                className="w-full rounded bg-ink px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                onClick={submitLogin}
                type="button"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
              {loginMessage ? <p className="text-sm text-coral">{loginMessage}</p> : null}
            </div>
          </div>

          <div className="rounded border border-line bg-white p-5 shadow-sm">
            <div className="mb-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-teal text-white">
                <UserPlus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-ink">{copy.registerTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{copy.registerBody}</p>
            </div>
            <div className="space-y-3">
              <input
                className="w-full rounded border border-line px-3 py-2"
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="Full name"
                value={registerName}
              />
              {role === "business" ? (
                <input
                  className="w-full rounded border border-line px-3 py-2"
                  onChange={(event) => setRegisterCompany(event.target.value)}
                  placeholder="Business name"
                  value={registerCompany}
                />
              ) : null}
              <input
                className="w-full rounded border border-line px-3 py-2"
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder={role === "business" ? "Work email" : "Email"}
                type="email"
                value={registerEmail}
              />
              <input
                className="w-full rounded border border-line px-3 py-2"
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="Password"
                type="password"
                value={registerPassword}
              />
              <input
                className="w-full rounded border border-line px-3 py-2"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                type="password"
                value={confirmPassword}
              />
              <button
                className="w-full rounded bg-teal px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                onClick={submitRegistration}
                type="button"
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </button>
              {registerMessage ? <p className="text-sm text-coral">{registerMessage}</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded border border-line bg-white px-3 py-2 shadow-sm">
      <span className="text-teal">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
