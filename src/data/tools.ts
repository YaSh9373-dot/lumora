import type { Tool } from "@/lib/types";

// commerciallySafe is an illustrative default for the prototype, not legal advice.
export const TOOLS: Tool[] = [
  { id: "runway", name: "Runway", category: "video", commerciallySafe: true, color: "#A3E635" },
  { id: "kling", name: "Kling", category: "video", commerciallySafe: false, color: "#22D3EE" },
  { id: "veo", name: "Veo", category: "video", commerciallySafe: true, color: "#60A5FA" },
  { id: "sora", name: "Sora", category: "video", commerciallySafe: true, color: "#F5F5F7" },
  { id: "luma", name: "Luma Dream Machine", category: "video", commerciallySafe: true, color: "#C084FC" },
  { id: "pika", name: "Pika", category: "video", commerciallySafe: false, color: "#FB7185" },
  { id: "hailuo", name: "Hailuo", category: "video", commerciallySafe: false, color: "#F472B6" },
  { id: "higgsfield", name: "Higgsfield", category: "video", commerciallySafe: false, color: "#34D399" },
  { id: "midjourney", name: "Midjourney", category: "image", commerciallySafe: true, color: "#E5E7EB" },
  { id: "flux", name: "Flux", category: "image", commerciallySafe: true, color: "#FBBF24" },
  { id: "comfyui", name: "Stable Diffusion / ComfyUI", category: "image", commerciallySafe: true, color: "#A78BFA" },
  { id: "firefly", name: "Adobe Firefly", category: "image", commerciallySafe: true, color: "#FF6B4A" },
  { id: "ideogram", name: "Ideogram", category: "image", commerciallySafe: false, color: "#38BDF8" },
  { id: "leonardo", name: "Leonardo", category: "image", commerciallySafe: false, color: "#FACC15" },
  { id: "krea", name: "Krea", category: "image", commerciallySafe: false, color: "#4ADE80" },
  { id: "magnific", name: "Magnific", category: "upscale", commerciallySafe: true, color: "#F97316" },
  { id: "topaz", name: "Topaz", category: "upscale", commerciallySafe: true, color: "#2DD4BF" },
  { id: "elevenlabs", name: "ElevenLabs", category: "audio", commerciallySafe: true, color: "#D4D4D8" },
  { id: "suno", name: "Suno", category: "audio", commerciallySafe: false, color: "#FB923C" },
  { id: "davinci", name: "DaVinci Resolve", category: "editing", commerciallySafe: true, color: "#818CF8" },
  { id: "aftereffects", name: "After Effects", category: "editing", commerciallySafe: true, color: "#9F7AEA" },
  { id: "blender", name: "Blender", category: "3d", commerciallySafe: true, color: "#F59E0B" },
];

export const TOOL_MAP: Record<string, Tool> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

export function getTool(id: string): Tool | undefined {
  return TOOL_MAP[id];
}
