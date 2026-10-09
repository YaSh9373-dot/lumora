import { NextResponse } from "next/server";
import { generateFallbackBrief } from "@/lib/fallback-brief";
import { callGemini, DEFAULT_GEMINI_MODEL } from "@/lib/gemini";
import { createRateLimiter } from "@/lib/rate-limit";
import { briefDraftSchema, briefInputSchema, sanitizeBriefDraft, type BriefBuilderResponse } from "@/lib/schemas";

const allow = createRateLimiter(8, 60_000);

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
}

export async function POST(req: Request) {
  if (!allow(clientIp(req))) {
    return NextResponse.json({ error: "Too many requests. Using smart templates instead." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const input = briefInputSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const idea = input.data.idea;
  const fallback = generateFallbackBrief(idea);
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const raw = await callGemini(idea, {
        apiKey,
        model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
        today: new Date().toISOString().slice(0, 10),
      });
      const isObject = typeof raw === "object" && raw !== null;
      if (isObject && "title" in raw && Array.isArray((raw as { deliverables?: unknown }).deliverables)) {
        const brief = briefDraftSchema.parse(sanitizeBriefDraft(raw, fallback));
        return NextResponse.json({ brief, source: "ai" } satisfies BriefBuilderResponse);
      }
    } catch {
      // Fall through to the deterministic generator. Never log the idea text.
    }
  }

  return NextResponse.json({ brief: fallback, source: "fallback" } satisfies BriefBuilderResponse);
}
