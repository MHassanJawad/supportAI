// Role-aware single-purpose authentication panel for Supabase email/password sessions.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, LogIn, ShieldCheck, UserPlus, Users } from "lucide-react";
import { supabase, supabaseConfigError } from "../lib/supabase";

type AuthRole = "business" | "customer";
type AuthMode = "login" | "register";
type AuthHref = "/business/login" | "/business/register" | "/customer/login" | "/customer/register";

interface AuthPanelProps {
  mode: AuthMode;
  role: AuthRole;
}

export function AuthPanel({ mode, role }: AuthPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessIndustry, setBusinessIndustry] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBusiness = role === "business";
  const isRegister = mode === "register";

  const copy = useMemo(() => {
    if (isBusiness && isRegister) {
      return {
        eyebrow: "Business registration",
        heading: "Register your business workspace.",
        body: "Create an owner account and save the business details SupportAI needs to prepare your support dashboard.",
        cardTitle: "Business information",
        cardBody: "Use your official business details so your customer support portal is easy to recognize.",
        dashboardHref: "/business/dashboard" as const,
        switchHref: "/business/login" as AuthHref,
        switchLabel: "Already have a registered business? Log in to your workspace.",
        submitLabel: "Register business",
        submittingLabel: "Creating business account..."
      };
    }

    if (isBusiness) {
      return {
        eyebrow: "Business login",
        heading: "Welcome back to your workspace.",
        body: "Sign in to manage documents, FAQs, analytics, and the customer support portal for your business.",
        cardTitle: "Business login",
        cardBody: "Access your existing business owner account.",
        dashboardHref: "/business/dashboard" as const,
        switchHref: "/business/register" as AuthHref,
        switchLabel: "New to SupportAI? Register your business.",
        submitLabel: "Sign in",
        submittingLabel: "Signing in..."
      };
    }

    if (isRegister) {
      return {
        eyebrow: "Customer registration",
        heading: "Create your customer account.",
        body: "Browse business support centers and keep your customer support conversations in one place.",
        cardTitle: "Customer account",
        cardBody: "Create a customer profile for asking questions across available business portals.",
        dashboardHref: "/customer/dashboard" as const,
        switchHref: "/customer/login" as AuthHref,
        switchLabel: "Already have a customer account? Log in instead.",
        submitLabel: "Create customer account",
        submittingLabel: "Creating account..."
      };
    }

    return {
      eyebrow: "Customer login",
      heading: "Find support from businesses you use.",
      body: "Sign in to browse available support portals and continue previous conversations.",
      cardTitle: "Customer login",
      cardBody: "Access your customer dashboard.",
      dashboardHref: "/customer/dashboard" as const,
      switchHref: "/customer/register" as AuthHref,
      switchLabel: "New customer? Create an account.",
      submitLabel: "Sign in",
      submittingLabel: "Signing in..."
    };
  }, [isBusiness, isRegister]);

  useEffect(() => {
    if (supabaseConfigError) {
      setMessage(supabaseConfigError);
    }
  }, []);

  async function submitLogin() {
    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    if (supabaseConfigError) {
      setMessage(supabaseConfigError);
      return;
    }

    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      router.push(copy.dashboardHref);
    } catch {
      setMessage("Unable to reach auth service. Verify Supabase URL/key and network connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitRegistration() {
    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim();
    if (!fullName.trim()) {
      setMessage(isBusiness ? "Enter the business owner name." : "Enter your full name.");
      return;
    }

    if (isBusiness && !businessName.trim()) {
      setMessage("Enter your business name.");
      return;
    }

    if (isBusiness && !businessIndustry.trim()) {
      setMessage("Enter your business industry.");
      return;
    }

    if (isBusiness && businessAddress.trim().length < 5) {
      setMessage("Enter your business address.");
      return;
    }

    if (!normalizedEmail) {
      setMessage(isBusiness ? "Enter a business email address." : "Enter an email address.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (supabaseConfigError) {
      setMessage(supabaseConfigError);
      return;
    }

    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            account_type: role,
            full_name: fullName.trim(),
            ...(isBusiness
              ? {
                  company_industry: businessIndustry.trim(),
                  company_address: businessAddress.trim(),
                  company_name: businessName.trim()
                }
              : {})
          }
        }
      });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (result.data.session) {
        router.push(copy.dashboardHref);
        return;
      }

      setMessage("Account created. Check your email if confirmation is enabled.");
    } catch {
      setMessage("Unable to reach auth service. Verify Supabase URL/key and network connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const icon = isRegister ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />;

  return (
    <main className="min-h-screen bg-mist px-5 py-8 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-ink" href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">{copy.eyebrow}</p>
            <h1 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl">{copy.heading}</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted">{copy.body}</p>
          </div>
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-3 lg:grid-cols-1">
            <TrustItem icon={<ShieldCheck className="h-4 w-4" />} label="Secure Supabase sessions" />
            <TrustItem
              icon={isBusiness ? <Building2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              label={isBusiness ? "Business owner access" : "Customer dashboard"}
            />
          </div>
        </section>

        <section className="surface mx-auto w-full max-w-xl rounded-[28px] p-5">
          <div className="mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-panel">{icon}</div>
            <h2 className="font-display text-2xl font-semibold">{copy.cardTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{copy.cardBody}</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (isRegister) {
                submitRegistration().catch(() => setMessage("Something went wrong while creating your account."));
              } else {
                submitLogin().catch(() => setMessage("Something went wrong while signing in."));
              }
            }}
          >
            {isRegister ? (
              <>
                {isBusiness ? (
                  <>
                    <Field
                      label="Business name"
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="Acme Retail"
                      value={businessName}
                    />
                    <Field
                      label="Industry"
                      onChange={(event) => setBusinessIndustry(event.target.value)}
                      placeholder="E-commerce, healthcare, education..."
                      value={businessIndustry}
                    />
                    <Field
                      label="Business address"
                      onChange={(event) => setBusinessAddress(event.target.value)}
                      placeholder="Street, city, state or province"
                      value={businessAddress}
                    />
                    <Field
                      label="Owner name"
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Hassan Jawad"
                      value={fullName}
                    />
                  </>
                ) : (
                  <Field
                    label="Full name"
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Hassan Jawad"
                    value={fullName}
                  />
                )}
              </>
            ) : null}

            <Field
              label={isBusiness ? "Business email" : "Email"}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={isBusiness ? "owner@business.com" : "you@example.com"}
              type="email"
              value={email}
            />
            <Field
              label="Password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              type="password"
              value={password}
            />
            {isRegister ? (
              <Field
                label="Confirm password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                type="password"
                value={confirmPassword}
              />
            ) : null}

            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? copy.submittingLabel : copy.submitLabel}
            </button>
            {message ? <p className="rounded-2xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{message}</p> : null}
          </form>

          <div className="mt-5 border-t border-line pt-5 text-center text-sm text-muted">
            <Link className="font-semibold text-accent hover:text-primary" href={copy.switchHref}>
              {copy.switchLabel}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className="min-h-11 rounded-2xl border border-line bg-panel px-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-panel px-3 py-2 shadow-sm">
      <span className="text-accent">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
