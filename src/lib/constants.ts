import type {
  AspectRatio,
  Availability,
  ContentType,
  Exclusivity,
  LicenseUse,
  Objective,
  Ownership,
  Resolution,
} from "./types";

export const SPECIALIZATIONS = [
  "AI Filmmaker",
  "AI Animator",
  "Product Ads",
  "Fashion & Lookbooks",
  "Music Videos",
  "Character Design",
  "Motion Graphics",
  "Social Shorts",
  "Brand Identity",
  "Architecture Viz",
  "Game Assets",
  "Explainer Videos",
] as const;

export const SKILLS = [
  "Prompt Engineering",
  "ComfyUI Pipelines",
  "LoRA Training",
  "Image-to-Video",
  "Video-to-Video",
  "Lip-Sync",
  "Character Consistency",
  "Storyboarding",
  "Color Grading",
  "Sound Design",
  "Upscaling",
  "Inpainting",
  "Motion Tracking",
  "3D Compositing",
  "Voice Cloning",
  "Music Generation",
] as const;

export const MOODS = [
  "cinematic",
  "playful",
  "minimalist",
  "surreal",
  "retro-futuristic",
  "hyper-real",
  "hand-drawn",
  "luxury",
  "gritty",
  "dreamy",
  "high-energy",
  "documentary",
] as const;

export const PLATFORMS = [
  "Instagram",
  "YouTube",
  "TikTok",
  "LinkedIn",
  "Facebook",
  "X",
  "Connected TV",
  "Out-of-home",
  "Website",
] as const;

export const CONTENT_TYPES = ["video", "animation", "image", "graphic", "audio", "3d"] as const satisfies readonly ContentType[];
export const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:5", "21:9"] as const satisfies readonly AspectRatio[];
export const RESOLUTIONS = ["1080p", "4K", "HD", "Print"] as const satisfies readonly Resolution[];
export const LICENSE_USES = ["organic-social", "paid-ads", "broadcast", "internal"] as const satisfies readonly LicenseUse[];
export const OWNERSHIPS = ["license", "full-buyout"] as const satisfies readonly Ownership[];
export const EXCLUSIVITIES = ["none", "category", "full"] as const satisfies readonly Exclusivity[];
export const OBJECTIVES = ["awareness", "launch", "conversion", "education", "brand-story"] as const satisfies readonly Objective[];
export const AVAILABILITIES = ["available", "limited", "booked"] as const satisfies readonly Availability[];
export const TERRITORIES = ["India", "APAC", "North America", "Europe", "Middle East", "Global"] as const;
export const LICENSE_DURATIONS = ["6 months", "1 year", "3 years", "perpetual"] as const;
export const TURNAROUND_OPTIONS = [3, 7, 14] as const;

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: "Video",
  animation: "Animation",
  image: "Image",
  graphic: "Graphic",
  audio: "Audio",
  "3d": "3D",
};

export const LICENSE_LABELS: Record<LicenseUse, string> = {
  "organic-social": "Organic social",
  "paid-ads": "Paid ads",
  broadcast: "Broadcast / TV",
  internal: "Internal",
};

export const OWNERSHIP_LABELS: Record<Ownership, string> = {
  license: "License",
  "full-buyout": "Full buyout",
};

export const EXCLUSIVITY_LABELS: Record<Exclusivity, string> = {
  none: "None",
  category: "Category",
  full: "Full",
};

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  awareness: "Awareness",
  launch: "Launch",
  conversion: "Conversion",
  education: "Education",
  "brand-story": "Brand story",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: "Available now",
  limited: "Limited",
  booked: "Booking ahead",
};

/** Fixed demo FX rate. Not live. */
export const USD_TO_INR = 85;

/** Specializations that align with each campaign objective (used by matching). */
export const OBJECTIVE_SPECIALIZATIONS: Record<Objective, string[]> = {
  awareness: ["AI Filmmaker", "Social Shorts", "Music Videos", "Motion Graphics"],
  launch: ["Product Ads", "Social Shorts", "AI Filmmaker"],
  conversion: ["Product Ads", "Social Shorts"],
  education: ["Explainer Videos", "Motion Graphics", "AI Animator"],
  "brand-story": ["AI Filmmaker", "AI Animator", "Brand Identity", "Character Design"],
};

export const COMMERCIAL_SAFE_THRESHOLD = 0.7;
export const VERIFIED_TRUST_THRESHOLD = 70;

export const SAFETY_FOOTNOTE =
  "Commercial-safety flags are illustrative in this prototype; always verify each tool's license.";
export const PROOF_FOOTNOTE =
  "In this prototype, proofs are simulated from seed data. In production these would be backed by uploaded project files, screen recordings, C2PA Content Credentials and client confirmations.";
