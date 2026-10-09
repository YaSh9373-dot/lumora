import { TOOL_MAP } from "@/data/tools";
import { addDays, normalizeText, unique } from "./format";
import type {
  AspectRatio,
  BriefDraft,
  ContentType,
  Currency,
  Deliverable,
  LicenseUse,
  Objective,
} from "./types";

// Deterministic keyword rules that turn a rough idea into a complete brief.
// Used when Gemini is unavailable, so the demo always works.

type Rule<T> = [RegExp, T];

const has = (text: string, re: RegExp) => re.test(text);
const collect = <T>(text: string, rules: Rule<T>[]): T[] => unique(rules.filter(([re]) => re.test(text)).map(([, v]) => v));

const PLATFORM_RULES: Rule<string>[] = [
  [/instagram|\binsta\b|\breels?\b|\bstor(y|ies)\b/, "Instagram"],
  [/tiktok/, "TikTok"],
  [/youtube|\bshorts\b/, "YouTube"],
  [/linkedin/, "LinkedIn"],
  [/facebook|\bfb\b/, "Facebook"],
  [/\btwitter\b|\bx\.com\b/, "X"],
  [/\btv\b|\bctv\b|television|broadcast/, "Connected TV"],
  [/billboard|\booh\b|out-of-home|hoarding/, "Out-of-home"],
  [/website|landing page|\bweb\b/, "Website"],
];

const TYPE_RULES: Rule<ContentType>[] = [
  [/video|film|reel|trailer|teaser|commercial|\bad\b|\bads\b|shorts|spot|clip/, "video"],
  [/cartoon|animat|anime|motion graphic|explainer/, "animation"],
  [/poster|image|banner|photo|still|visual|lookbook|carousel|key art|thumbnail/, "image"],
  [/logo|graphic|identity|icon|infographic|packaging/, "graphic"],
  [/music|jingle|song|podcast|voice ?over|soundtrack|audio/, "audio"],
  [/\b3d\b|render|cgi/, "3d"],
];

const MOOD_RULES: Rule<string>[] = [
  [/luxur|premium|elegant|high-end/, "luxury"],
  [/cinematic|epic|\bfilm\b|movie/, "cinematic"],
  [/fun|playful|kids|quirky|cute|whimsical/, "playful"],
  [/minimal|clean|simple/, "minimalist"],
  [/surreal|weird|trippy/, "surreal"],
  [/dream|soft|ethereal/, "dreamy"],
  [/retro|80s|90s|synthwave|futur|cyber|neon/, "retro-futuristic"],
  [/realistic|photoreal|hyper-?real|lifelike/, "hyper-real"],
  [/cartoon|hand-?drawn|illustrat|sketch|anime|storybook/, "hand-drawn"],
  [/gritty|raw|street|urban/, "gritty"],
  [/energ|hype|sport|run|dance|fast|bold/, "high-energy"],
  [/documentary|real stories|testimonial|journalis/, "documentary"],
];

const MOOD_PALETTES: Record<string, string[]> = {
  luxury: ["#0B090A", "#C9A227", "#F5F3F4"],
  cinematic: ["#0F4C5C", "#E36414", "#FB8B24"],
  playful: ["#FF006E", "#FFBE0B", "#3A86FF"],
  minimalist: ["#F8F9FA", "#ADB5BD", "#212529"],
  surreal: ["#B8C0FF", "#FFD6FF", "#7209B7"],
  dreamy: ["#CDB4DB", "#FFC8DD", "#BDE0FE"],
  "retro-futuristic": ["#F72585", "#4CC9F0", "#3A0CA3"],
  "hyper-real": ["#2B2D42", "#8D99AE", "#EDF2F4"],
  "hand-drawn": ["#F4A261", "#2A9D8F", "#FEFAE0"],
  gritty: ["#283618", "#606C38", "#DDA15E"],
  "high-energy": ["#7C5CFF", "#22D3EE", "#FF5CAA"],
  documentary: ["#335C67", "#E09F3E", "#FFF3B0"],
};

const SKILLS_BY_TYPE: Record<ContentType, string[]> = {
  video: ["Image-to-Video", "Prompt Engineering", "Color Grading"],
  animation: ["Character Consistency", "Storyboarding"],
  image: ["Prompt Engineering", "Upscaling"],
  graphic: ["Prompt Engineering", "Inpainting"],
  audio: ["Sound Design", "Music Generation"],
  "3d": ["3D Compositing"],
};

const TOOLS_BY_TYPE: Record<ContentType, string[]> = {
  video: ["runway", "kling"],
  animation: ["comfyui", "aftereffects"],
  image: ["midjourney", "flux"],
  graphic: ["ideogram", "firefly"],
  audio: ["elevenlabs", "suno"],
  "3d": ["blender"],
};

const INDIA = /india|mumbai|delhi|bengaluru|bangalore|chennai|hyderabad|kolkata|pune|hindi|diwali|holi|rupee|₹|\brs\.?\s?\d|\binr\b|lakh|crore|desi|chai/;

export interface ParsedBudget {
  min: number;
  max: number;
  currency: Currency;
}

/** Finds the first money mention like "$2000", "under 50k", "₹1.5 lakh", "2000 usd". */
export function parseBudget(text: string): ParsedBudget | null {
  const re =
    /(under|below|max(?:imum)?|up ?to|within|around|about|budget(?: of| is)?)?\s*(₹|rs\.?\s?|inr\s?|\$|usd\s?)?(\d+(?:[.,]\d+)*)\s*(k|lakhs?|lacs?|l)?\b\s*(usd|dollars?|inr|rupees?)?/gi;
  for (const m of text.matchAll(re)) {
    const [, qualifier, prefix, digits, suffix, postfix] = m;
    if (!prefix && !suffix && !postfix && !/budget/i.test(qualifier ?? "")) continue;
    let value = parseFloat(digits.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) continue;
    const s = (suffix ?? "").toLowerCase();
    if (s === "k") value *= 1_000;
    else if (s.startsWith("l")) value *= 100_000;
    const cur = `${prefix ?? ""}${postfix ?? ""}`.toLowerCase();
    const currency: Currency = /\$|usd|dollar/.test(cur)
      ? "USD"
      : /₹|rs|inr|rupee/.test(cur) || s.startsWith("l")
        ? "INR"
        : INDIA.test(text.toLowerCase())
          ? "INR"
          : "USD";
    const capOnly = /under|below|max|up ?to|within/i.test(qualifier ?? "");
    const max = Math.round(value);
    const min = Math.round(value * (capOnly ? 0.5 : 0.7));
    return { min, max, currency };
  }
  return null;
}

/** Finds a duration like "15 second", "30s", "1 min". Returns seconds. */
export function parseDuration(text: string): number | null {
  const sec = text.match(/(\d{1,3})\s*-?\s*(?:s|sec|secs|second|seconds)\b/i);
  if (sec) return Math.min(600, parseInt(sec[1], 10));
  const min = text.match(/(\d{1,2})\s*-?\s*(?:min|mins|minute|minutes)\b/i);
  if (min) return Math.min(600, parseInt(min[1], 10) * 60);
  return null;
}

function parseQuantity(text: string, type: ContentType): number {
  const nouns: Record<ContentType, string> = {
    video: "videos?|reels?|ads?|clips?|shorts|spots?",
    animation: "animations?|explainers?",
    image: "posters?|images?|banners?|photos?|stills?|visuals?",
    graphic: "graphics?|logos?|icons?",
    audio: "tracks?|jingles?|songs?|episodes?",
    "3d": "renders?|models?",
  };
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10 };
  const m = text.match(new RegExp(`(\\d{1,2}|one|two|three|four|five|six|ten)\\s+(?:\\w+\\s+)?(?:${nouns[type]})\\b`, "i"));
  if (!m) return 1;
  const n = words[m[1].toLowerCase()] ?? parseInt(m[1], 10);
  return Math.min(20, Math.max(1, n));
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveTitle(idea: string): string {
  const words = idea
    .replace(/[^\p{L}\p{N}\s&'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !/^(a|an|the|i|we|need|want|make|create|for|our|my|please)$/i.test(w))
    .slice(0, 6);
  return words.length ? titleCase(words.join(" ")).slice(0, 80) : "Untitled brief";
}

function deriveBrand(idea: string): string {
  const m = idea.match(/\b(?:for|by|brand|client)\s+([A-Z][\w&'.-]*(?:\s+[A-Z][\w&'.-]*){0,2})/);
  return m ? m[1] : "Your brand";
}

function deriveObjective(t: string): Objective {
  if (has(t, /explain|explainer|tutorial|educat|learn|course|lesson|how to/)) return "education";
  if (has(t, /\bsale\b|convert|sign ?up|download|\bbuy\b|offer|discount|install/)) return "conversion";
  if (has(t, /launch|new product|product|teaser|\bads?\b|drop|release/)) return "launch";
  if (has(t, /story|heritage|journey|about us|founder|mission|brand film/)) return "brand-story";
  return "awareness";
}

function deriveAudience(t: string, india: boolean): string {
  const rules: Rule<string>[] = [
    [/gen ?z|teen|college|student/, "Gen Z and college students"],
    [/parent|mom|mother|dad|famil/, "Young parents and families"],
    [/developer|engineer|tech|saas|startup/, "Tech professionals and founders"],
    [/gamer|gaming/, "Gamers aged 16–30"],
    [/runner|fitness|gym|athlet|sport/, "Fitness enthusiasts aged 18–35"],
    [/coffee|cafe|café|food|restaurant/, "Local food and coffee lovers"],
    [/luxur|premium/, "Affluent shoppers aged 28–45"],
    [/business|b2b|enterprise|linkedin/, "Business decision-makers"],
  ];
  const hit = rules.find(([re]) => re.test(t));
  const base = hit ? hit[1] : "Digital-first audience aged 18–34";
  return india ? `${base} in India` : base;
}

function deriveTerritory(t: string, india: boolean): string {
  if (has(t, /global|worldwide|international/)) return "Global";
  if (india) return "India";
  if (has(t, /\busa?\b|america|canada/)) return "North America";
  if (has(t, /europe|\buk\b|london|paris|berlin/)) return "Europe";
  if (has(t, /dubai|uae|saudi|middle east|qatar/)) return "Middle East";
  if (has(t, /asia|apac|singapore|japan|tokyo/)) return "APAC";
  return "Global";
}

function aspectFor(type: ContentType, vertical: boolean, wide: boolean): AspectRatio {
  if (type === "audio") return "1:1";
  if (type === "image" || type === "graphic") return vertical ? "4:5" : wide ? "16:9" : "1:1";
  return vertical ? "9:16" : "16:9";
}

export function generateFallbackBrief(idea: string, today: Date = new Date()): BriefDraft {
  const t = normalizeText(idea);
  const india = INDIA.test(t) || INDIA.test(idea.toLowerCase());

  let types = collect(t, TYPE_RULES);
  // "ad" alone with an explicit image noun shouldn't force video
  if (types.includes("video") && types.includes("image") && !has(t, /video|film|reel|teaser|trailer|shorts|clip|spot/)) {
    types = types.filter((x) => x !== "video");
  }
  if (!types.length) types = ["video"];
  types = types.slice(0, 3);

  const platforms = collect(t, PLATFORM_RULES);
  const vertical = has(t, /instagram|\binsta\b|reel|tiktok|shorts|stor(y|ies)|vertical|9:16/);
  const wide = has(t, /youtube|film|trailer|\btv\b|widescreen|16:9|website/);
  const duration = parseDuration(idea);

  const deliverables: Deliverable[] = types.map((type, i) => {
    const timed = type === "video" || type === "animation" || type === "audio";
    return {
      id: `d${i + 1}`,
      contentType: type,
      quantity: parseQuantity(t, type),
      aspectRatio: aspectFor(type, vertical, wide),
      resolution: type === "image" || type === "graphic" ? (has(t, /print|poster|billboard/) ? "Print" : "4K") : has(t, /\b4k\b|\btv\b|\bcinema\b/) ? "4K" : "1080p",
      ...(timed ? { durationSec: duration ?? (vertical ? 15 : 30) } : {}),
    };
  });

  let moods = collect(t, MOOD_RULES);
  if (types.includes("animation") && !moods.includes("hand-drawn") && has(t, /cartoon|animated/)) moods.push("hand-drawn");
  if (!moods.length) moods = types.includes("animation") ? ["playful"] : ["cinematic"];
  moods = moods.slice(0, 4);

  const objective = deriveObjective(t);
  const usage: LicenseUse[] = ["organic-social"];
  if (objective === "launch" || objective === "conversion" || has(t, /\bads?\b|campaign|paid|promo/)) usage.push("paid-ads");
  if (has(t, /\btv\b|broadcast|television|cinema/)) usage.push("broadcast");
  if (has(t, /internal|training|onboarding|employee/)) usage.push("internal");

  const safeOnly = has(t, /commercial(ly)? safe|brand safe|licensed|legal|copyright|safe tools/);
  let tools = unique(types.flatMap((x) => TOOLS_BY_TYPE[x]));
  if (safeOnly) tools = tools.filter((id) => TOOL_MAP[id]?.commerciallySafe);

  const skills = unique([
    ...types.flatMap((x) => SKILLS_BY_TYPE[x]),
    ...(has(t, /voice|narrat|voiceover/) ? ["Voice Cloning"] : []),
    ...(has(t, /lip|presenter|talking|spokesperson|avatar/) ? ["Lip-Sync"] : []),
    ...(has(t, /character|mascot/) ? ["Character Consistency"] : []),
  ]).slice(0, 5);

  const parsed = parseBudget(idea);
  const currency: Currency = parsed?.currency ?? (india ? "INR" : "USD");
  const budget = parsed ?? (currency === "INR" ? { min: 50000, max: 100000, currency } : { min: 800, max: 1500, currency });

  const buyout = has(t, /buyout|buy-out|own (the|all) rights|full rights/);
  const forever = has(t, /perpetual|forever|lifetime/);

  return {
    title: deriveTitle(idea),
    brandName: deriveBrand(idea),
    idea: idea.trim().slice(0, 600),
    objective,
    audience: deriveAudience(t, india),
    deliverables,
    moods,
    palette: MOOD_PALETTES[moods[0]] ?? MOOD_PALETTES.cinematic,
    references: [],
    avoid: "Real people's likenesses, third-party logos and trademarked characters.",
    requiredSkills: skills,
    preferredToolIds: tools.slice(0, 4),
    commercial: {
      usageTypes: unique(usage),
      platforms: platforms.length ? platforms : vertical ? ["Instagram", "TikTok"] : ["Instagram", "YouTube"],
      territory: deriveTerritory(t, india),
      licenseDuration: forever || buyout ? "perpetual" : usage.includes("paid-ads") ? "1 year" : "6 months",
      exclusivity: has(t, /exclusiv/) ? "full" : "none",
      ownership: buyout ? "full-buyout" : "license",
      aiDisclosureRequired: true,
      watermarkFree: true,
      derivativeRights: has(t, /edit|cutdown|cut-down|variation|derivative/),
      commerciallySafeToolsOnly: safeOnly,
    },
    budget,
    deadline: addDays(today, 14),
    revisionRounds: 2,
  };
}
