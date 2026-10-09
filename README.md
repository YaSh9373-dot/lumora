# Lumora — hire the people who *direct* the machines

![CI](https://github.com/Yashgurav002/lumora/actions/workflows/ci.yml/badge.svg)

An AI-native creative marketplace. Brands discover AI filmmakers, animators and designers by the tools they master and the workflows they can prove, write structured briefs with AI help, and run each engagement through to delivery.

Built for the **byteXL x KampusIC** hackathon challenge, "AI Content Creator Marketplace".

**Live demo:** `<your-vercel-url>` · No login needed.

<!-- Screenshots: add docs/screenshots/*.png and link them here -->
| Landing | Discover | Profile & workflow | Brief builder |
|---|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ | _screenshot_ |

## Features

- **AI-native creator profiles**: tools with proficiency, years and verification; skills, specializations, formats; commercial terms; and a portfolio where every piece can show **how it was made** (steps, tools, prompt example, generations, hours).
- **Discover**: search plus combined filters (specialization, tools, skills, content type, format, budget, availability, turnaround, verified only, commercial-safe tools). Facet counts, active-filter chips, five sorts, URL-synced state, and a Creators grid or a Cosmos-style **Works** masonry with a lightbox.
- **Structured briefs**: deliverables (type, quantity, aspect ratio, duration, resolution), style and palette, skills and tools, full commercial-use terms (usage, platforms, territory, duration, exclusivity, ownership, disclosure, watermark, edit rights), budget and timeline. A live preview and a completeness meter gate publishing.
- **AI Brief Builder**: one rough line turns into a complete brief through Gemini, with a deterministic fallback so it always works.
- **Matching**: ranked creators per brief, each with a 0–100 score and plain-language reasons (matched / missing / notes).
- **Verification signals and trust score**, computed from the data.
- **Engagements** at two URLs, `/engagements/brand` (hiring pipeline) and `/engagements/creator` (my jobs): invite → accept → start → review → revise → deliver, enforced by a pure state machine with role checks and a revision limit.
- **Creator teams**: after accepting a job, the lead creator can invite up to 3 other creators with a role and a fee share (the lead keeps at least 40%). Each collaborator accepts or declines, and the brand sees one combined engagement with the team.
- **Join as creator**: a 4-step wizard. The new profile appears in Discover tagged "You".
- **Demo Controls** (bottom-right): switch Brand/Creator role, simulate an acceptance, load sample engagements, reset.
- `⌘K` / `Ctrl+K` command palette, and `/` to focus search.

## Tech stack

Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · shadcn/ui (Base UI) · `motion` · Zustand (persisted to localStorage) · Zod · React Hook Form · Vitest · Google Gemini (free tier) · Vercel Hobby. All free.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: add GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (add `-- --coverage` for the v8 report) |
| `npm run build` | Production build |

### Environment variables

| Name | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | No | Server-only. Without it the brief builder uses smart templates. Free key: https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | No | Defaults to `gemini-3-flash-preview`. |

## Architecture

- **`src/lib/`** holds all business logic as pure, framework-free modules: `filters`, `matching`, `verification`, `completeness`, `engagement`, `fallback-brief`, `schemas`, `cover`, `format`. UI components stay thin and import from here.
- **Media:** 10 pieces use short muted stock clips from Mixkit (free license) in `public/media` as placeholders for AI-made work; they play on hover and in the lightbox. The rest use procedural `AuroraCover` art. See [`public/media/CREDITS.md`](public/media/CREDITS.md).
- **`src/data/`** holds static, typed seed data: 22 tools, 10 fictional creators with 45 portfolio pieces, and 2 sample briefs.
- **`src/lib/store.ts`** is a Zustand store persisted to localStorage for briefs, engagements, shortlist, user profile and role. It hydrates after mount, so server and client renders match.
- **`/api/brief-builder`** validates input with Zod, calls Gemini with an 8s timeout and a JSON response schema, then sanitizes and validates the output. On any failure it falls back to the deterministic generator. It has a soft per-IP rate limit, and the key never reaches the client.
- **Design system** (`src/components/effects/`) is built by hand: aurora background, spotlight cards, border beam, marquee, procedural `AuroraCover` art (seeded PRNG, so SSR and client output match) and global film grain.

## How verification works

| Signal | Earned when | Weight |
|---|---|---|
| Tools verified | ≥ 60% of listed tools verified (and ≥ 2 tools) | 30 × ratio |
| Workflow shared | ≥ 50% of pieces have a 3+ step workflow (and ≥ 2 pieces) | 30 × ratio |
| Past work verified | ≥ 2 client-confirmed pieces | 25 × min(count, 4) / 4 |
| Identity verified | ID checked | 15 |

The trust score (0–100) is the sum. "Verified only" means trust ≥ 70. In this prototype the proofs are simulated from seed data.

## How matching works

The weights sum to 100: skills 25 · content type 20 · tools 15 (weighted by proficiency) · style 12 plus a 3-point specialization bonus · format 10 · budget 10 (tapers to 0 at 2× the max) · commercial terms 5. A verification bonus adds up to 5 points. If the brief requires commercially safe tools and the creator fails the ≥ 70% rule, the creator takes a −25 penalty and the reasons explain why. Results are sorted by score, then trust.

## Design decisions

- **Workflow is first-class data**, not a text blob, so it can be shown as a stepper, counted toward trust, and filtered on.
- **Commercial terms are structured** on both sides (creator offers vs. brief requires), so they can be matched.
- **Verification is derived**, never a hand-set flag.
- **No backend.** Seed data plus localStorage keeps the demo instant and free. The data model maps directly onto tables (see [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)).
- **Dark-only theme on CSS variables**, so a light theme can be added later.

## Testing

108 Vitest tests cover filters (AND across groups, OR within groups, AND for skills, FX-converted budget, facets, URL round-trip), matching, verification thresholds, completeness gating, every allowed and forbidden engagement transition, creator-team rules (share limits, duplicates, max team size), fallback keyword rules (including gibberish input), AI-output sanitizing, the API route (success, timeout, bad JSON, HTTP error, missing key, rate limit), plus two component tests. Line coverage on `src/lib` is about 99%, and CI enforces ≥ 80%.

## Limitations and next steps

- Proofs, client confirmations and identity checks are simulated. Next steps are real uploads, screen recordings and C2PA Content Credentials.
- Data is per-browser. Next step is Postgres with auth and real messaging.
- The rate limit is per serverless instance (best effort).
- Commercial-safety flags on tools are illustrative, not legal advice.

## Docs

- [Data model note](docs/DATA_MODEL.md)
- [2-minute demo script and slide outline](docs/DEMO_SCRIPT.md)
- [Submission text](docs/SUBMISSION.md)
