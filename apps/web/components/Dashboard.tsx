// Main authenticated business dashboard for documents, FAQs, chat, and analytics.
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BarChart3,
  Building2,
  ExternalLink,
  FileText,
  FileUp,
  LayoutDashboard,
  Loader2,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Settings,
  UploadCloud,
  X
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { supabase } from "../lib/supabase";
import { ThemeToggle } from "./ThemeToggle";
import { StatusToast } from "./ui";

interface Business {
  id: string;
  name: string;
  industry: string;
  created_at: string;
}

interface Membership {
  role: string;
  businesses: Business | Business[];
}

interface Profile {
  userId: string;
  memberships: Membership[];
}

interface DocumentRow {
  id: string;
  filename: string;
  status: string;
  created_at?: string;
}

interface FaqRow {
  id: string;
  question: string;
  answer: string;
}

interface AnalyticsSummary {
  totalQueries: number;
  averageResponseTimeMs: number;
  mostAskedQuestions: Array<{ question: string; count: number }>;
}

interface ChatSource {
  documentId: string;
  documentName: string;
  chunkId: string;
  score: number;
  excerpt: string;
}

type ActionName = "refresh" | "business" | "upload" | "faq" | "chat";

const navItems = [
  { label: "Dashboard Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Business Profile", icon: <Building2 className="h-4 w-4" /> },
  { label: "Document Manager", icon: <FileText className="h-4 w-4" /> },
  { label: "Chat Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Settings", icon: <Settings className="h-4 w-4" /> }
];

export function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [conversationId, setConversationId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerSources, setAnswerSources] = useState<ChatSource[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState<ActionName | null>("refresh");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("supportai-sidebar-collapsed");
    setIsCollapsed(stored === "true");
  }, []);

  const activeBusiness = useMemo(() => {
    const firstMembership = profile?.memberships?.[0];
    if (!firstMembership) {
      return null;
    }

    return Array.isArray(firstMembership.businesses) ? firstMembership.businesses[0] ?? null : firstMembership.businesses;
  }, [profile]);

  async function refresh(options: { silent?: boolean } = {}) {
    if (!options.silent) {
      setBusyAction("refresh");
    }
    setError("");

    try {
      const profileData = await apiRequest<Profile>("/api/v1/profile");
      setProfile(profileData);
      const hasBusiness = profileData.memberships.length > 0;

      if (!hasBusiness) {
        setDocuments([]);
        setFaqs([]);
        setAnalytics(null);
        if (!options.silent) {
          setNotice("Create your business workspace to unlock uploads, FAQs, chat, and analytics.");
        }
        return;
      }

      const [documentData, faqData, analyticsData] = await Promise.all([
        apiRequest<DocumentRow[]>("/api/v1/documents"),
        apiRequest<FaqRow[]>("/api/v1/faqs"),
        apiRequest<AnalyticsSummary>("/api/v1/analytics/summary")
      ]);
      setDocuments(documentData);
      setFaqs(faqData);
      setAnalytics(analyticsData);
      if (!options.silent) {
        setNotice("Dashboard refreshed.");
      }
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (!options.silent) {
        setBusyAction(null);
      }
    }
  }

  useEffect(() => {
    refresh().catch((refreshError: unknown) => setError(getErrorMessage(refreshError)));
  }, []);

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction || activeBusiness) {
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const industry = String(form.get("industry") ?? "").trim();

    if (!name || !industry) {
      setError("Enter both business name and industry.");
      return;
    }

    setBusyAction("business");
    setError("");
    setNotice("");

    try {
      await apiRequest("/api/v1/businesses", {
        method: "POST",
        body: JSON.stringify({ name, industry })
      });
      formElement.reset();
      setNotice(`${name} was created successfully.`);
      await refresh({ silent: true });
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setBusyAction(null);
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction || !activeBusiness) {
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!form.get("file")) {
      setError("Choose a PDF or TXT file before uploading.");
      return;
    }

    setBusyAction("upload");
    setError("");
    setNotice("");

    try {
      await apiRequest("/api/v1/documents", { method: "POST", body: form });
      formElement.reset();
      setNotice("Document uploaded and queued for processing.");
      await refresh({ silent: true });
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setBusyAction(null);
      setIsDragging(false);
    }
  }

  async function createFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction || !activeBusiness) {
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const faqQuestion = String(form.get("question") ?? "").trim();
    const faqAnswer = String(form.get("answer") ?? "").trim();

    if (!faqQuestion || !faqAnswer) {
      setError("Enter both FAQ question and answer.");
      return;
    }

    setBusyAction("faq");
    setError("");
    setNotice("");

    try {
      await apiRequest("/api/v1/faqs", {
        method: "POST",
        body: JSON.stringify({ question: faqQuestion, answer: faqAnswer })
      });
      formElement.reset();
      setNotice("FAQ added.");
      await refresh({ silent: true });
    } catch (faqError) {
      setError(getErrorMessage(faqError));
    } finally {
      setBusyAction(null);
    }
  }

  async function askQuestion() {
    if (busyAction || !activeBusiness) {
      return;
    }

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError("Enter a question before asking the chatbot.");
      return;
    }

    setBusyAction("chat");
    setError("");
    setNotice("");

    try {
      const conversation =
        conversationId ||
        (
          await apiRequest<{ id: string }>("/api/v1/chat/conversations", {
            method: "POST",
            body: JSON.stringify({ title: trimmedQuestion.slice(0, 80) || "Customer chat" })
          })
        ).id;

      setConversationId(conversation);
      const response = await apiRequest<{ answer: string; sources: ChatSource[] }>(
        `/api/v1/chat/conversations/${conversation}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content: trimmedQuestion })
        }
      );
      setAnswer(response.answer);
      setAnswerSources(response.sources);
      setQuestion("");
      setNotice(
        response.sources.length > 0
          ? `Answer generated from ${response.sources.length} retrieved source chunk${response.sources.length === 1 ? "" : "s"}.`
          : "Answer generated, but no matching knowledge-base chunks were retrieved."
      );
      await refresh({ silent: true });
    } catch (chatError) {
      setError(getErrorMessage(chatError));
    } finally {
      setBusyAction(null);
    }
  }

  function toggleSidebar() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    window.localStorage.setItem("supportai-sidebar-collapsed", String(next));
  }

  const isWorkspaceLocked = !activeBusiness;
  const supportPath = activeBusiness ? `/support/${activeBusiness.id}` : "";
  const readyDocs = documents.filter((document) => document.status === "ready").length;

  return (
    <main className="min-h-screen bg-mist text-ink">
      <StatusToast message={notice} tone="success" />
      <StatusToast message={error} tone="error" />
      <button
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-40 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-panel shadow-soft lg:hidden"
        onClick={() => setIsSidebarOpen(true)}
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>
      {isSidebarOpen ? <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-panel p-3 shadow-soft transition lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-72"} w-72`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex min-h-11 items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-panel">
              <MessageSquare className="h-5 w-5" />
            </span>
            {!isCollapsed ? <span className="font-display font-semibold">SupportAI</span> : null}
          </div>
          <button className="min-h-11 min-w-11 rounded-xl lg:hidden" onClick={() => setIsSidebarOpen(false)} type="button">
            <X className="mx-auto h-5 w-5" />
          </button>
          <button className="hidden min-h-11 min-w-11 rounded-xl border border-line lg:block" onClick={toggleSidebar} type="button">
            {isCollapsed ? <PanelLeftOpen className="mx-auto h-4 w-4" /> : <PanelLeftClose className="mx-auto h-4 w-4" />}
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item, index) => (
            <a
              className={`relative flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium ${
                index === 0 ? "bg-accent/10 text-accent" : "text-muted hover:bg-mist hover:text-ink"
              }`}
              href="#overview"
              key={item.label}
            >
              {index === 0 ? <span className="absolute left-0 h-6 w-1 rounded-full bg-accent" /> : null}
              {item.icon}
              {!isCollapsed ? <span>{item.label}</span> : null}
            </a>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-line bg-mist p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-panel">
              {activeBusiness?.name?.slice(0, 1).toUpperCase() ?? "B"}
            </div>
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{activeBusiness?.name ?? "No business yet"}</p>
                <p className="truncate text-xs text-muted">{activeBusiness?.industry ?? "Create workspace"}</p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <section className={`transition-all ${isCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="border-b border-line bg-panel/85 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="pl-14 lg:pl-0">
              <p className="text-sm font-medium text-accent">Business owner dashboard</p>
              <h1 className="font-display text-2xl font-semibold">Workspace Overview</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-panel px-4 text-sm disabled:opacity-60"
                disabled={busyAction !== null}
                onClick={() => refresh()}
                type="button"
              >
                {busyAction === "refresh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </button>
              <ThemeToggle />
              <button className="min-h-11 rounded-full border border-line bg-panel px-4 text-sm" onClick={() => supabase.auth.signOut()} type="button">
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6" id="overview">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Documents uploaded" value={documents.length} />
            <KpiCard label="Ready documents" value={readyDocs} />
            <KpiCard label="Customer queries" value={analytics?.totalQueries ?? 0} />
            <KpiCard label="Avg response ms" value={analytics?.averageResponseTimeMs ?? 0} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel icon={<Building2 className="h-5 w-5" />} title="My Business Profile">
              {activeBusiness ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-line bg-mist p-4">
                    <p className="font-display text-xl font-semibold">{activeBusiness.name}</p>
                    <p className="mt-1 text-sm text-muted">{activeBusiness.industry}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-semibold text-white"
                      href={supportPath}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Preview Customer Portal
                    </a>
                    <button className="min-h-11 rounded-2xl border border-line bg-panel px-4 text-sm font-semibold" type="button">
                      Edit Business Info
                    </button>
                  </div>
                  <p className="break-all rounded-2xl border border-line bg-panel p-3 text-xs text-muted">{supportPath}</p>
                </div>
              ) : (
                <form className="grid gap-3" onSubmit={createBusiness}>
                  <Field label="Business Name" name="name" placeholder="Acme Retail" />
                  <Field label="Industry" name="industry" placeholder="E-commerce, healthcare, education..." />
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-panel disabled:opacity-70"
                    disabled={busyAction !== null}
                    type="submit"
                  >
                    {busyAction === "business" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {busyAction === "business" ? "Creating..." : "Create business"}
                  </button>
                </form>
              )}
            </Panel>

            <Panel icon={<FileUp className="h-5 w-5" />} title="Document Manager">
              <form
                className={`mb-4 rounded-3xl border border-dashed p-5 text-center ${
                  isDragging ? "border-accent bg-accent/10" : "border-line bg-mist"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDrop={() => setIsDragging(false)}
                onSubmit={uploadDocument}
              >
                <UploadCloud className="mx-auto h-9 w-9 text-accent" />
                <p className="mt-3 font-semibold">Drag files here or choose a document</p>
                <p className="mt-1 text-sm text-muted">PDF and TXT supported in this MVP.</p>
                <input
                  className="mt-4 w-full rounded-2xl border border-line bg-panel px-3 py-3"
                  disabled={isWorkspaceLocked || busyAction !== null}
                  name="file"
                  type="file"
                />
                <button
                  className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-4 font-semibold text-white disabled:opacity-70"
                  disabled={isWorkspaceLocked || busyAction !== null}
                  type="submit"
                >
                  {busyAction === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  {busyAction === "upload" ? "Processing..." : "Upload New Document"}
                </button>
              </form>
              <div className="grid gap-3 sm:grid-cols-2">
                {documents.length > 0 ? (
                  documents.map((document) => <DocumentCard document={document} key={document.id} />)
                ) : (
                  <EmptyState message="Upload your first document to start answering customer questions." />
                )}
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="FAQ Manager">
              <form className="mb-4 grid gap-3" onSubmit={createFaq}>
                <Field disabled={isWorkspaceLocked || busyAction !== null} label="Question" name="question" placeholder="What is your refund policy?" />
                <label className="grid gap-2 text-sm font-medium">
                  Answer
                  <textarea
                    className="min-h-24 rounded-2xl border border-line bg-panel px-3 py-3 text-sm focus:border-accent"
                    disabled={isWorkspaceLocked || busyAction !== null}
                    name="answer"
                    placeholder="Refunds are available within 14 days..."
                  />
                </label>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-panel disabled:opacity-70"
                  disabled={isWorkspaceLocked || busyAction !== null}
                  type="submit"
                >
                  {busyAction === "faq" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {busyAction === "faq" ? "Adding..." : "Add FAQ"}
                </button>
              </form>
              <div className="space-y-3">
                {faqs.length > 0 ? (
                  faqs.map((faq) => (
                    <article className="rounded-2xl border border-line bg-mist p-4" key={faq.id}>
                      <p className="font-semibold">{faq.question}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{faq.answer}</p>
                    </article>
                  ))
                ) : (
                  <EmptyState message="Add FAQs to publish them in the customer portal." />
                )}
              </div>
            </Panel>

            <Panel icon={<MessageSquare className="h-5 w-5" />} title="Chat Analytics & Preview">
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {(analytics?.mostAskedQuestions ?? []).slice(0, 4).map((item) => (
                  <div className="rounded-2xl border border-line bg-mist p-3" key={item.question}>
                    <p className="truncate text-sm font-semibold">{item.question}</p>
                    <p className="text-xs text-muted">{item.count} queries</p>
                  </div>
                ))}
              </div>
              <textarea
                className="h-28 w-full rounded-2xl border border-line bg-panel px-3 py-3 text-sm"
                disabled={isWorkspaceLocked || busyAction !== null}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a test customer question..."
                value={question}
              />
              <button
                className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-4 font-semibold text-white disabled:opacity-70"
                disabled={isWorkspaceLocked || busyAction !== null}
                onClick={askQuestion}
                type="button"
              >
                {busyAction === "chat" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {busyAction === "chat" ? "Thinking..." : "Ask"}
              </button>
              {answer ? <p className="mt-4 rounded-2xl border border-line bg-mist p-4 text-sm leading-6">{answer}</p> : null}
              {answerSources.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-semibold">Sources</p>
                  {answerSources.map((source) => (
                    <div className="rounded-2xl border border-line p-3 text-sm" key={source.chunkId}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate font-medium">{source.documentName}</p>
                        <span className="shrink-0 text-xs text-muted">{source.score.toFixed(3)}</span>
                      </div>
                      <p className="mt-1 line-clamp-3 text-muted">{source.excerpt}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </Panel>
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-line bg-panel p-4 shadow-sm hover:shadow-soft">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
    </article>
  );
}

function Panel({ children, icon, title }: { children: React.ReactNode; icon?: React.ReactNode; title: string }) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  disabled,
  label,
  name,
  placeholder
}: {
  disabled?: boolean;
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className="min-h-11 rounded-2xl border border-line bg-panel px-3 text-sm focus:border-accent"
        disabled={disabled}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function DocumentCard({ document }: { document: DocumentRow }) {
  const isReady = document.status === "ready";
  const isFailed = document.status === "failed";

  return (
    <article className="animate-in rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mist text-accent">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{document.filename}</p>
          <p className="text-xs text-muted">{document.created_at ? document.created_at.slice(0, 10) : "Uploaded"}</p>
        </div>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          isReady ? "bg-accent/10 text-accent" : isFailed ? "bg-coral/10 text-coral" : "bg-primary/10 text-primary"
        }`}
      >
        {document.status}
      </span>
      {document.status === "processing" ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-line"><div className="h-full w-2/3 animate-pulse rounded-full bg-accent" /></div> : null}
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-mist p-5 text-center text-sm text-muted sm:col-span-2">
      {message}
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
