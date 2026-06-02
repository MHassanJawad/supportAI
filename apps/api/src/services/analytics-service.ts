// Analytics aggregation services for business dashboards.
import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../errors/app-error";

export async function getAnalyticsSummary(businessId: string) {
  const { data: messages, error: messageError } = await supabaseAdmin
    .from("messages")
    .select("content, sender, created_at")
    .eq("business_id", businessId);

  if (messageError) {
    throw new AppError("DATABASE_ERROR", "Could not load message analytics.", 500);
  }

  const { data: events, error: eventError } = await supabaseAdmin
    .from("analytics_events")
    .select("properties, created_at")
    .eq("business_id", businessId)
    .eq("event_name", "chat_answered");

  if (eventError) {
    throw new AppError("DATABASE_ERROR", "Could not load usage analytics.", 500);
  }

  const customerMessages = (messages ?? []).filter((message) => message.sender === "customer");
  const dailyUsage = customerMessages.reduce<Record<string, number>>((accumulator, message) => {
    const day = String(message.created_at).slice(0, 10);
    accumulator[day] = (accumulator[day] ?? 0) + 1;
    return accumulator;
  }, {});
  const questionCounts = customerMessages.reduce<Record<string, number>>((accumulator, message) => {
    const normalized = String(message.content).trim().toLowerCase();
    accumulator[normalized] = (accumulator[normalized] ?? 0) + 1;
    return accumulator;
  }, {});
  const responseTimes = (events ?? [])
    .map((event) => Number((event.properties as { responseTimeMs?: number })?.responseTimeMs))
    .filter(Number.isFinite);

  return {
    totalQueries: customerMessages.length,
    dailyUsage,
    mostAskedQuestions: Object.entries(questionCounts)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 10)
      .map(([question, count]) => ({ question, count })),
    averageResponseTimeMs:
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
        : 0
  };
}
