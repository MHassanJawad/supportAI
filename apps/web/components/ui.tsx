// Shared visual primitives for SupportAI screens.
import { CheckCircle2, Info, XCircle } from "lucide-react";

export function StatusToast({ message, tone }: { message: string; tone: "success" | "error" | "info" }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : Info;
  const toneClass =
    tone === "success"
      ? "border-accent/30 bg-accent/10 text-accent"
      : tone === "error"
        ? "border-coral/30 bg-coral/10 text-coral"
        : "border-line bg-panel text-ink";

  if (!message) {
    return null;
  }

  return (
    <div className={`fixed right-4 top-4 z-50 flex max-w-sm animate-in items-start gap-2 rounded-2xl border px-4 py-3 shadow-soft ${toneClass}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-sm leading-6">{message}</p>
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line/60 ${className}`} />;
}
