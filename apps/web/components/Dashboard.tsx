// Main authenticated dashboard for documents, FAQs, chat, and analytics.
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BarChart3, Building2, CheckCircle2, FileUp, Loader2, MessageSquare, Plus, RefreshCw } from "lucide-react";
import { apiRequest } from "../lib/api";
import { supabase } from "../lib/supabase";

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

  const isWorkspaceLocked = !activeBusiness;

  return (
    <main className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h1 className="text-xl font-semibold text-ink">SupportAI Console</h1>
            <p className="text-sm text-slate-600">
              {activeBusiness ? `${activeBusiness.name} - ${activeBusiness.industry}` : "Set up your business workspace"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busyAction !== null}
              onClick={() => refresh()}
              title="Refresh"
              type="button"
            >
              {busyAction === "refresh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
            <button className="rounded border border-line px-3 py-2 text-sm" onClick={() => supabase.auth.signOut()} type="button">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-5">
        {notice ? <StatusMessage tone="success" message={notice} /> : null}
        {error ? <StatusMessage tone="error" message={error} /> : null}
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="space-y-5">
          <Panel icon={<Building2 className="h-4 w-4" />} title="Business">
            {activeBusiness ? (
              <div className="space-y-3">
                <div className="rounded border border-line bg-mist p-3">
                  <p className="font-medium text-ink">{activeBusiness.name}</p>
                  <p className="text-sm text-slate-600">{activeBusiness.industry}</p>
                </div>
                <p className="flex items-center gap-2 text-sm text-teal">
                  <CheckCircle2 className="h-4 w-4" />
                  Workspace is ready.
                </p>
              </div>
            ) : (
              <form className="space-y-2" onSubmit={createBusiness}>
                <input className="w-full rounded border border-line px-3 py-2" name="name" placeholder="Business name" />
                <input className="w-full rounded border border-line px-3 py-2" name="industry" placeholder="Industry" />
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={busyAction !== null}
                  type="submit"
                >
                  {busyAction === "business" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {busyAction === "business" ? "Creating..." : "Create business"}
                </button>
              </form>
            )}
          </Panel>

          <Panel icon={<BarChart3 className="h-4 w-4" />} title="Analytics">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric label="Queries" value={analytics?.totalQueries ?? 0} />
              <Metric label="Avg ms" value={analytics?.averageResponseTimeMs ?? 0} />
            </div>
            <div className="mt-3 space-y-1 text-sm">
              {(analytics?.mostAskedQuestions ?? []).length > 0 ? (
                analytics!.mostAskedQuestions.map((item) => (
                  <p className="truncate" key={item.question}>
                    {item.count} - {item.question}
                  </p>
                ))
              ) : (
                <p className="text-slate-500">No customer questions yet.</p>
              )}
            </div>
          </Panel>
        </aside>

        <section className="grid gap-5 xl:grid-cols-2">
          <Panel icon={<FileUp className="h-4 w-4" />} title="Knowledge Base">
            <form className="mb-4 flex flex-col gap-2 sm:flex-row" onSubmit={uploadDocument}>
              <input
                className="min-w-0 flex-1 rounded border border-line px-3 py-2"
                disabled={isWorkspaceLocked || busyAction !== null}
                name="file"
                type="file"
              />
              <button
                className="inline-flex items-center justify-center gap-2 rounded bg-teal px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isWorkspaceLocked || busyAction !== null}
                type="submit"
              >
                {busyAction === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                Upload
              </button>
            </form>
            <ListEmptyGuard isEmpty={documents.length === 0} message="No documents uploaded yet.">
              {documents.map((document) => (
                <div className="flex items-center justify-between gap-3 rounded border border-line p-2" key={document.id}>
                  <span className="min-w-0 truncate">{document.filename}</span>
                  <span className="shrink-0 text-xs uppercase text-teal">{document.status}</span>
                </div>
              ))}
            </ListEmptyGuard>
          </Panel>

          <Panel title="FAQs">
            <form className="mb-4 space-y-2" onSubmit={createFaq}>
              <input
                className="w-full rounded border border-line px-3 py-2"
                disabled={isWorkspaceLocked || busyAction !== null}
                name="question"
                placeholder="Question"
              />
              <textarea
                className="h-20 w-full rounded border border-line px-3 py-2"
                disabled={isWorkspaceLocked || busyAction !== null}
                name="answer"
                placeholder="Answer"
              />
              <button
                className="inline-flex items-center justify-center gap-2 rounded bg-ink px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isWorkspaceLocked || busyAction !== null}
                type="submit"
              >
                {busyAction === "faq" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {busyAction === "faq" ? "Adding..." : "Add FAQ"}
              </button>
            </form>
            <ListEmptyGuard isEmpty={faqs.length === 0} message="No FAQs added yet.">
              {faqs.map((faq) => (
                <div className="rounded border border-line p-2" key={faq.id}>
                  <p className="font-medium">{faq.question}</p>
                  <p className="text-sm text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </ListEmptyGuard>
          </Panel>

          <Panel icon={<MessageSquare className="h-4 w-4" />} title="Chat Test">
            <textarea
              className="h-28 w-full rounded border border-line px-3 py-2"
              disabled={isWorkspaceLocked || busyAction !== null}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a customer question..."
              value={question}
            />
            <button
              className="mt-2 inline-flex items-center justify-center gap-2 rounded bg-teal px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isWorkspaceLocked || busyAction !== null}
              onClick={askQuestion}
              type="button"
            >
              {busyAction === "chat" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              {busyAction === "chat" ? "Thinking..." : "Ask"}
            </button>
            {answer ? <p className="mt-4 rounded border border-line bg-mist p-3 text-sm">{answer}</p> : null}
            {answer ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-ink">Retrieved sources</p>
                {answerSources.length > 0 ? (
                  answerSources.map((source) => (
                    <div className="rounded border border-line p-2 text-sm" key={source.chunkId}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate font-medium">{source.documentName}</p>
                        <span className="shrink-0 text-xs text-slate-500">{source.score.toFixed(3)}</span>
                      </div>
                      <p className="mt-1 line-clamp-4 text-slate-600">{source.excerpt}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded border border-dashed border-line p-3 text-sm text-slate-500">
                    No chunks were retrieved. Check that the document status is ready and that the question uses words from
                    the PDF.
                  </p>
                )}
              </div>
            ) : null}
          </Panel>

          <Panel title="Workspace Status">
            <p className="text-sm text-slate-600">
              {activeBusiness
                ? "Uploads, FAQs, chat history, and analytics are scoped to this business."
                : "Create a business first. The rest of the workspace will unlock automatically."}
            </p>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({ children, icon, title }: { children: React.ReactNode; icon?: React.ReactNode; title: string }) {
  return (
    <section className="rounded border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-line p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function StatusMessage({ message, tone }: { message: string; tone: "success" | "error" }) {
  return (
    <p
      className={`rounded border px-3 py-2 text-sm ${
        tone === "success" ? "border-teal/30 bg-teal/10 text-teal" : "border-coral/30 bg-coral/10 text-coral"
      }`}
    >
      {message}
    </p>
  );
}

function ListEmptyGuard({
  children,
  isEmpty,
  message
}: {
  children: React.ReactNode;
  isEmpty: boolean;
  message: string;
}) {
  if (isEmpty) {
    return <p className="rounded border border-dashed border-line p-3 text-sm text-slate-500">{message}</p>;
  }

  return <div className="space-y-2">{children}</div>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
