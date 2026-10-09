/** FNV-1a 32-bit string hash. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 seeded PRNG: deterministic so SSR and client render the same art. */
export function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CoverBlob {
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface CoverStyle {
  blobs: CoverBlob[];
  base: string;
  angle: number;
  backgroundImage: string;
}

const FALLBACK_PALETTE = ["#7C5CFF", "#FF5CAA", "#FFB45C"];

export function getAuroraCoverStyle(seed: string, palette: string[]): CoverStyle {
  const colors = palette.length ? palette : FALLBACK_PALETTE;
  const rand = seededRandom(hashString(seed));
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const count = colors.length >= 3 ? 4 : 3;
  const blobs: CoverBlob[] = Array.from({ length: count }, (_, i) => ({
    x: r2(rand() * 100),
    y: r2(rand() * 100),
    size: r2(45 + rand() * 50),
    color: colors[i % colors.length],
  }));
  const angle = Math.round(rand() * 360);
  const base = colors[colors.length - 1];
  const backgroundImage = [
    ...blobs.map((b) => `radial-gradient(circle at ${b.x}% ${b.y}%, ${b.color} 0%, transparent ${b.size}%)`),
    `linear-gradient(${angle}deg, ${colors[0]}33, ${base}cc)`,
  ].join(", ");
  return { blobs, base, angle, backgroundImage };
}
