import { USD_TO_INR } from "./constants";
import type { Currency } from "./types";

/** Lowercase and strip accents so "Café" matches "cafe". */
export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function tokenize(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

export function toUSD(amount: number, currency: Currency): number {
  return currency === "USD" ? amount : amount / USD_TO_INR;
}

export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return to === "USD" ? amount / USD_TO_INR : amount * USD_TO_INR;
}

export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(sec?: number): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}:${String(s).padStart(2, "0")}` : `0:${String(s).padStart(2, "0")}`;
}

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(s: string): string {
  return normalizeText(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
