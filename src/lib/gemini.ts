import { z } from "zod";
import { TOOLS } from "@/data/tools";
import {
  ASPECT_RATIOS,
  CONTENT_TYPES,
  EXCLUSIVITIES,
  LICENSE_DURATIONS,
  LICENSE_USES,
  MOODS,
  OBJECTIVES,
  OWNERSHIPS,
  PLATFORMS,
  RESOLUTIONS,
  SKILLS,
  TERRITORIES,
} from "./constants";
import { briefDraftSchema } from "./schemas";

export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
export const GEMINI_TIMEOUT_MS = 8000;

const SYSTEM_INSTRUCTION =
  "You are a senior creative producer for AI-generated content. Convert the rough idea into a complete structured brief. Choose ONLY from the allowed values provided. Be specific and realistic. Default currency INR for India-sounding briefs else USD. Never include commentary, only JSON.";

function allowedValues(today: string): string {
  return [
    `Today is ${today}. Deadline must be an ISO date (YYYY-MM-DD) after today.`,
    `contentType: ${CONTENT_TYPES.join(", ")}`,
    `aspectRatio: ${ASPECT_RATIOS.join(", ")}`,
    `resolution: ${RESOLUTIONS.join(", ")}`,
    `objective: ${OBJECTIVES.join(", ")}`,
    `moods: ${MOODS.join(", ")}`,
    `requiredSkills: ${SKILLS.join(", ")}`,
    `preferredToolIds: ${TOOLS.map((t) => `${t.id} (${t.name})`).join(", ")}`,
    `usageTypes: ${LICENSE_USES.join(", ")}`,
    `platforms: ${PLATFORMS.join(", ")}`,
    `territory: ${TERRITORIES.join(", ")}`,
    `licenseDuration: ${LICENSE_DURATIONS.join(", ")}`,
    `exclusivity: ${EXCLUSIVITIES.join(", ")}`,
    `ownership: ${OWNERSHIPS.join(", ")}`,
    "revisionRounds: integer 1-5. palette: up to 4 hex colors like #AABBCC. durationSec only for video/animation/audio.",
  ].join("\n");
}

function responseSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(briefDraftSchema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}

/**
 * Calls Gemini and returns the parsed JSON (untrusted, must be sanitized), or
 * throws on any failure (timeout, HTTP error, bad JSON).
 */
export async function callGemini(
  idea: string,
  { apiKey, model, fetchImpl = fetch, today }: { apiKey: string; model: string; fetchImpl?: typeof fetch; today: string },
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: "user", parts: [{ text: `Allowed values:\n${allowedValues(today)}\n\nRough idea:\n${idea}` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: responseSchema(),
            temperature: 0.6,
          },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}
