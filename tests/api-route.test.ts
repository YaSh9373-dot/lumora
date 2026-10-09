import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { briefBuilderResponseSchema } from "@/lib/schemas";

let ipCounter = 0;
function req(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return new Request("http://localhost/api/brief-builder", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const aiBrief = {
  title: "AI Title",
  brandName: "Acme",
  objective: "launch",
  audience: "Runners",
  deliverables: [{ contentType: "video", quantity: 2, aspectRatio: "9:16", durationSec: 15, resolution: "1080p" }],
  moods: ["high-energy"],
  requiredSkills: ["Image-to-Video"],
  preferredToolIds: ["kling"],
  commercial: { usageTypes: ["paid-ads"], platforms: ["Instagram"], territory: "India", licenseDuration: "1 year" },
  budget: { min: 1000, max: 2000, currency: "USD" },
  deadline: "2026-12-01",
  revisionRounds: 3,
};

function geminiResponse(payload: unknown, status = 200) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status });
}

async function loadRoute() {
  vi.resetModules();
  return (await import("@/app/api/brief-builder/route")).POST;
}

const IDEA = { idea: "A 15 second instagram reel for a sneaker launch" };

describe("POST /api/brief-builder", () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.GEMINI_API_KEY;
  });

  it("returns 400 for invalid input", async () => {
    const POST = await loadRoute();
    expect((await POST(req({ idea: "short" }))).status).toBe(400);
    expect((await POST(req("not json"))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
  });

  it("uses the fallback when no key is set", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const POST = await loadRoute();
    const res = await POST(req(IDEA));
    expect(res.status).toBe(200);
    expect(briefBuilderResponseSchema.parse(await res.json()).source).toBe("fallback");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns source ai with a schema-valid brief when Gemini succeeds", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchSpy = vi.fn().mockResolvedValue(geminiResponse(aiBrief));
    vi.stubGlobal("fetch", fetchSpy);
    const POST = await loadRoute();
    const json = briefBuilderResponseSchema.parse(await (await POST(req(IDEA))).json());
    expect(json.source).toBe("ai");
    expect(json.brief.title).toBe("AI Title");
    expect(json.brief.revisionRounds).toBe(3);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toContain(":generateContent");
    expect(url).not.toContain("test-key");
    expect(init.headers["x-goog-api-key"]).toBe("test-key");
  });

  it.each([
    ["HTTP error", () => Promise.resolve(geminiResponse({}, 500))],
    ["invalid JSON", () => Promise.resolve(geminiResponse("{not json"))],
    ["wrong shape", () => Promise.resolve(geminiResponse({ hello: "world" }))],
    ["network failure", () => Promise.reject(new Error("boom"))],
  ])("falls back on Gemini %s", async (_, impl) => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockImplementation(impl));
    const POST = await loadRoute();
    const res = await POST(req(IDEA));
    expect(res.status).toBe(200);
    expect(briefBuilderResponseSchema.parse(await res.json()).source).toBe("fallback");
  });

  it("aborts slow Gemini calls after the 8s timeout and falls back", async () => {
    vi.useFakeTimers();
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
      ),
    );
    const POST = await loadRoute();
    const pending = POST(req(IDEA));
    await vi.advanceTimersByTimeAsync(8001);
    expect((await (await pending).json()).source).toBe("fallback");
  });

  it("rate limits to 8 requests per minute per IP", async () => {
    const POST = await loadRoute();
    const statuses: number[] = [];
    for (let i = 0; i < 9; i++) statuses.push((await POST(req(IDEA, "1.2.3.4"))).status);
    expect(statuses.slice(0, 8).every((s) => s === 200)).toBe(true);
    expect(statuses[8]).toBe(429);
  });
});
