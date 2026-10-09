# PRD: Lumora — AI Content Creator Marketplace

> Working name: **Lumora** (rename freely). Built for the byteXL x KampusIC hackathon challenge "AI Content Creator Marketplace".
> Everything must be built with **free tools only** and hosted on **Vercel (Hobby plan)**.

---

## 0. READ THIS FIRST (instructions for Claude Code)

You are building this entire project from this one document. The owner has **limited tokens**, so work efficiently.

**Token-saving rules (follow strictly):**
1. Read this PRD **once**. Do not re-read it; refer to your own notes. Do not ask the owner questions. Where something is unclear, make the most sensible decision and keep going. The decisions already made are in Section 3.
2. Do not explore the file system with repeated `ls`/`cat`. You are scaffolding from scratch, so you know what exists.
3. Write each file **completely in one go**. Avoid many tiny edits to the same file.
4. Install shadcn components in **one command** with all component names listed.
5. Run `npm run build` only at the end of a phase (see Section 14), not after every file. Run lint and tests at phase gates.
6. Commit after each phase with a short message. Use `/compact` between phases if context is large.
7. Keep your chat replies very short: one or two lines on what you finished and what is next. Never paste file contents back.
8. Do not create documentation beyond what is listed in Section 12.
9. Do not add features outside this PRD. If time or tokens run short, follow the cut order in Section 15.

**Quality bar:** The UI must look like a premium, award-level product (think Linear, Vercel, Cosmos, 21st.dev showcases, top Dribbble shots). Plain default-looking shadcn pages are a failure. Section 5 is the design spec. Follow it closely.

**The code is also reviewed automatically** for quality, maintainability and test coverage. So: strict TypeScript, no `any`, small focused modules, pure logic separated from UI, meaningful tests (Section 13), clean README.

---

## 1. Problem Statement

Generative AI has created a new kind of creative professional: AI filmmakers, AI animators, generative designers. Brands and agencies want to hire them but have no good way to:

- **Discover** creators with proven AI-production skill.
- **Judge** AI-specific work. A normal portfolio doesn't show which models were used, how the piece was made, how many generations it took, or whether the output is safe for commercial use.
- **Brief** them properly. AI work needs briefs that specify tools, aspect ratios, durations, revision rounds and licensing/commercial-use terms.
- **Manage** the engagement from first contact to delivery.

Existing freelance marketplaces (Fiverr, Upwork, etc.) are not built around AI-native workflows.

## 2. Solution

A beautiful, fast, AI-native marketplace with two sides:

**For brands/agencies**
- Browse creators and individual works with rich filters (tool, skill, specialization, content type, format, budget, verification).
- Write a **structured creative brief** (content type, style, aspect ratio, duration, platforms, budget, timeline, commercial-use requirements). An **AI Brief Builder** turns a rough one-line idea into a complete structured brief.
- See a ranked list of **best-match creators** for each brief with a match score and plain-language reasons.
- Invite creators and track the engagement through a pipeline: Invited → Accepted → In progress → In review → Revision → Delivered.

**For creators**
- A rich **AI-native profile**: tools/models used (with proficiency), skills, specializations, formats, pricing, commercial terms, and a portfolio where every piece shows its **workflow breakdown** (steps, tools, example prompt, number of generations, hours spent).
- **Verification signals** (verified tools, shared workflows, verified past work, identity) rolled into a visible trust score.
- A simple "Join as creator" flow to publish their own profile.

**Demo model:** no login. Data is seeded from static files; anything the user creates (briefs, engagements, a new creator profile, shortlist) is saved in the browser (localStorage). A small **Demo Controls** panel lets judges switch between Brand view and Creator view, simulate a creator accepting an invite, and reset data.

---

## 3. Decisions Already Made (do not revisit)

| Area | Decision |
|---|---|
| Framework | Next.js latest stable, App Router, TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (copy-paste components, free) |
| Animation | `motion` package (formerly Framer Motion), imported from `motion/react` |
| Icons | `lucide-react` |
| Fonts | `next/font`: Geist Sans, Geist Mono, and Instrument Serif (italic, accent words only) |
| State | Zustand with `persist` middleware (localStorage) for user-generated data |
| Validation | `zod` for brief schema, API input/output, form validation |
| Forms | `react-hook-form` + `@hookform/resolvers/zod` |
| Data | Static TypeScript seed files. **No database. No auth.** |
| AI | Google Gemini free tier via a Next.js Route Handler (server-side key). Deterministic **fallback generator** when the key is missing, the call fails, or the quota is hit |
| Theme | **Dark only** (defined via CSS variables so light mode could be added later) |
| Tests | Vitest (+ coverage via v8). Unit tests on pure logic and the API route |
| CI | GitHub Actions: lint, typecheck, test, build |
| Hosting | Vercel Hobby, auto-deploy from the public GitHub repo |
| Images | Procedurally generated "aurora" cover art (SVG/CSS) as the primary visual, DiceBear avatars, optional real media dropped into `/public/media` |
| Package manager | npm |

---

## 4. Evaluation Rubric → Where This PRD Targets Points

| Criteria (points) | What wins it | Where in this PRD |
|---|---|---|
| Creator Profiles & AI Portfolios (25) | Rich profile: AI work, tools/models, skills, specialization, **workflow** | 7.3, 8, 9 |
| Brief Definition (20) | Complete brief: content type, style, aspect ratio, commercial use | 7.4, 8, 10 |
| Discovery & Filtering (25) | Accurate combined filters, sensible portfolio viewing | 7.2, 11 |
| User Experience (15) | Easy flows for both sides | 6, 7 |
| Presentation & Demo (15) | Clear demo/slides + clean data model note | 12 |
| Bonus (5–10) | Verification signals; AI Brief Builder | 9, 10 |

Everything required by the challenge ("Core Scope", "Deliverables", "Bonus") is in scope. Anything not required is cut or marked optional.

---

## 5. Design Specification (the UI must be stunning)

### 5.1 Reference inspiration
Claude Code cannot browse, so the look is described concretely below. The visual targets are:

- **Cosmos.so**: calm, image-first, masonry boards, almost no UI chrome, generous spacing, soft hover reveals. Use this feeling for the **Works** masonry and portfolio grids.
- **21st.dev**: polished component details: hairline borders, subtle inner highlights, glow on hover, spotlight cards, animated gradients, crisp micro-interactions. Use this for cards, buttons, badges, inputs.
- **Dribbble top shots**: big cover imagery, overlay metadata on hover, confident type, rich gradients. Use this for creator cards and the landing hero.
- Also in the same family: **Linear** (dark, precise, glowing accents), **Vercel** (grid backgrounds, mono labels), **Framer** and **Awwwards** hero sections (big type, animated background), **Magic UI / Aceternity UI** style effects (spotlight, border beam, marquee, aurora). Re-implement these effects by hand with CSS and `motion`; do not add paid libraries.

### 5.2 Design tokens (define as CSS variables, map in Tailwind theme)

**Color (dark only)**
- `--background`: `#07070B` (near black with a hint of blue)
- `--surface`: `#0D0D14`
- `--surface-2`: `#14141D`
- `--surface-3`: `#1B1B27`
- `--border`: `rgba(255,255,255,0.08)`; `--border-strong`: `rgba(255,255,255,0.16)`
- `--foreground`: `#F5F5F7`; `--muted`: `#9A9AB0`; `--subtle`: `#6B6B80`
- **Aurora gradient (brand):** `#7C5CFF` (violet) → `#FF5CAA` (pink) → `#FFB45C` (amber). Used for primary CTAs, key highlights, rings, gradient text.
- `--verified`: `#34D399` (emerald); `--info`: `#22D3EE` (cyan); `--warning`: `#FBBF24`; `--danger`: `#F87171`

**Shape and depth**
- Radius: cards 20px, inputs/buttons 12px, chips fully rounded, modals 24px.
- Every card: 1px hairline border + `inset 0 1px 0 rgba(255,255,255,0.06)` top highlight + soft large shadow (`0 24px 60px -20px rgba(0,0,0,0.6)`).
- Glass surfaces (nav, popovers, sheets): `bg-white/5`, `backdrop-blur-xl`, border `white/10`.
- **Noise overlay:** one global fixed SVG `feTurbulence` grain layer at ~4% opacity over the whole app for a filmic texture.

**Typography**
- Headings: Geist Sans, weight 600, tracking `-0.04em` on display sizes. Hero: 64–84px desktop (clamp), 40px mobile, line-height 1.02.
- **Accent words** inside headlines use Instrument Serif *italic* (e.g. "Hire the people who *direct* the machines.").
- Body: Geist Sans 15–16px, line-height 1.6, color `--muted` for secondary text.
- Labels/eyebrows/metadata: Geist Mono, 11–12px, uppercase, tracking `0.08em`.

**Motion**
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Durations 200–500ms.
- Page enter: fade + 8px translate-up. Grids: staggered children (40ms).
- Card hover: lift 2–4px, border brightens, spotlight follows cursor.
- Filter changes: `AnimatePresence` + `layout` so cards glide to new positions.
- Respect `prefers-reduced-motion` (disable aurora drift, parallax, marquee).

### 5.3 Signature effects to build once as reusable components
1. **`AuroraBackground`**: 3 large blurred gradient blobs (violet, pink, amber at low opacity) slowly drifting (CSS keyframes, 20–30s), over a faint dotted grid with a radial mask fade. Used in hero and profile banners.
2. **`SpotlightCard`**: a card wrapper that tracks the mouse and renders a radial gradient highlight under the cursor (CSS variables `--mx`, `--my` set in `onMouseMove`). Also shows a gradient hairline border on hover (mask-composite technique).
3. **`GradientButton`** (primary CTA): aurora gradient background, subtle shimmer sweep on hover, inner top highlight, glow shadow in violet. Secondary button: glass with hairline border.
4. **`BorderBeam`** (optional, used sparingly on the AI Brief Builder card): a small light segment orbiting the card border.
5. **`Marquee`**: infinite horizontal scroll of tool-name chips (text only, with colored dot; do NOT use real brand logos).
6. **`AuroraCover`**: deterministic procedural cover art. Takes a seed string and a palette, outputs an SVG/CSS mesh gradient (3–4 radial gradients positioned by a seeded hash) with grain and an optional centered title. Every portfolio piece without real media uses this, so the whole app is always visually rich with zero external assets. Add a faint "play" glyph on video-type pieces and a duration badge.
7. **`MatchRing`**: circular progress ring (SVG) showing match %, aurora stroke, number in the center in Geist Mono.
8. **`VerifiedBadge` cluster**: small emerald shield/check icons with tooltips.
9. **`CommandPalette`** (`⌘K` / `Ctrl+K`, via shadcn `Command`): quick jump to pages, search creators by name, tool, or skill.

### 5.4 Layout rules
- Max content width 1280px, page gutters 24px (16px mobile). Sections separated by 96–128px on desktop.
- **Top nav:** sticky, glass, logo (gradient glyph + wordmark), links (Discover, Briefs, Engagements), `⌘K` hint pill, role indicator ("Viewing as Brand/Creator"), primary button "Post a brief".
- Mobile-first and fully responsive. Filters become a bottom sheet on mobile. Nav collapses to a sheet menu.
- Empty, loading and error states must be designed (skeleton shimmer, friendly illustration-like gradient icon, clear CTA).
- Focus rings visible (violet), keyboard accessible, ARIA labels on icon buttons, contrast AA for body text.

---

## 6. Users and User Stories

**Personas:** (1) *Brand marketer/agency producer* who needs AI-made content fast. (2) *AI creator* who wants to be discovered and trusted. (3) *Hackathon judge* who needs to understand the product in 2 minutes.

### Brand / Agency
1. As a brand, I want to browse creators in a visually rich grid, so that I can quickly see style and quality.
2. As a brand, I want to filter creators by tool, skill, specialization, content type and format, so that I only see relevant people.
3. As a brand, I want to combine multiple filters with clear active-filter chips, so that I understand and can undo my filtering.
4. As a brand, I want to search by name, tool or skill with instant results, so that I can jump straight to what I need.
5. As a brand, I want to switch between a Creators view and a Works view, so that I can judge by outcomes or by people.
6. As a brand, I want to open any work and see how it was made (tools, steps, prompt example, generations, hours), so that I can trust the creator's process.
7. As a brand, I want to see whether a creator's tools are suitable for commercial use, so that I avoid legal risk.
8. As a brand, I want to see verification signals and a trust score on every creator, so that I can pick confidently.
9. As a brand, I want to write a rough idea and have AI create a full structured brief, so that I save time.
10. As a brand, I want every brief field to be editable after the AI fills it, so that I stay in control.
11. As a brand, I want a live preview and a completeness meter for my brief, so that I know it is clear enough to publish.
12. As a brand, I want to specify content type, deliverables, aspect ratios, durations, style, platforms, budget, timeline, revision rounds and commercial-use terms, so that creators know exactly what I need.
13. As a brand, I want a ranked list of best-match creators for my brief with a match score and reasons, so that I don't have to search manually.
14. As a brand, I want to shortlist creators, so that I can compare later.
15. As a brand, I want to invite a creator to my brief with one click, so that engagement starts quickly.
16. As a brand, I want to track each engagement's status through delivery, so that I always know where things stand.
17. As a brand, I want to request revisions and mark work delivered, so that the workflow is complete.

### Creator
18. As a creator, I want a profile that shows my tools, skills, specializations and formats, so that brands understand what I can do.
19. As a creator, I want each portfolio piece to document my workflow, so that I can prove real AI-production skill.
20. As a creator, I want to state my pricing, turnaround, revisions and licensing terms, so that expectations are clear up front.
21. As a creator, I want verification badges for my tools, workflow, past work and identity, so that brands trust me.
22. As a creator, I want to join and publish a profile through a short guided form, so that onboarding is easy.
23. As a creator, I want to see invites and accept or decline them, so that I control my work.

### Judge
24. As a judge, I want the app to work with no signup, so that I can evaluate immediately.
25. As a judge, I want a Demo Controls panel (switch role, simulate acceptance, reset), so that I can see both sides of the flow in minutes.
26. As a judge, I want the AI Brief Builder to always return a result, even if the AI service is down, so that the demo never breaks.

---

## 7. Product Requirements by Page

### 7.1 Landing page `/`
Sections, in order:
1. **Hero:** `AuroraBackground`, eyebrow pill ("AI-native creative marketplace" with a pulsing dot), headline with serif-italic accent word, one-sentence subhead, two CTAs ("Find creators" → `/creators`, "Post a brief" → `/briefs/new`). Below: a floating 3D-tilted stack/row of 3 `AuroraCover` work cards with parallax on mouse move (CSS transforms; subtle).
2. **Tool marquee:** infinite scroll of tool chips ("Runway", "Kling", "Veo", "Midjourney", "ComfyUI", "Flux", "ElevenLabs", "Suno", "Blender", "DaVinci Resolve"...). Text chips only.
3. **Bento grid "Built for AI-native work"** (6 tiles, varied sizes, `SpotlightCard`): AI Portfolios with workflows; Structured briefs; Smart matching; Verification signals; Commercial-use clarity; End-to-end engagements. Each tile has a small animated mini-visual (e.g., animated match ring, typing prompt line, stepping pipeline dots).
4. **How it works:** 3 steps (Describe → Match → Deliver) with connecting line animation on scroll.
5. **AI Brief Builder teaser:** interactive mini demo inside a `BorderBeam` card: a fake typing animation of a rough idea turning into structured chips. CTA to `/briefs/new`.
6. **Featured creators:** 4 creator cards (reuse `CreatorCard`).
7. **Trust section:** explains verification signals (4 badges).
8. **Final CTA band** + footer (links, "Built for the byteXL x KampusIC hackathon").

### 7.2 Discover `/creators`
- **Header:** title, result count (animated number), segmented control **Creators | Works**.
- **Search bar** (large, glass, `/` focuses it). Searches name, headline, tools, skills, specializations (case-insensitive, token-based, debounce 150ms).
- **Filter bar** (horizontal chips that open popovers, multi-select with counts, "Clear" per filter):
  - Specialization, Tools, Skills, Content type, Format (aspect ratio), Budget (range slider), Availability (Available now / Booking), Turnaround (≤3, ≤7, ≤14 days), **Verified only** (switch), **Commercial-safe tools only** (switch).
- **Active filters row** (removable chips + "Clear all").
- **Sort:** Best match (default when a brief is selected), Top rated, Price low→high, Fastest turnaround, Most verified.
- **"Match for brief" selector:** optional dropdown of the user's published briefs. When chosen, cards show `MatchRing` and results default-sort by match.
- **Filter logic:** AND across different filter groups; OR within a group for Tools/Specialization/Content type/Format; **Skills use "has all selected"** (AND) to be strict and accurate. Document this in a small helper text under the Skills filter ("Creator must have all selected skills").
- **URL sync:** all filters/sort/view stored in query params so a filtered view is shareable and survives refresh.
- **Creators view:** responsive grid (1/2/3 columns). **Creator card:** 3-thumbnail mosaic cover of their work (`AuroraCover`/real media), avatar overlapping the mosaic, name, headline, verified cluster, up to 3 tool chips + "+N", starting price, availability dot, rating, optional `MatchRing`, heart (shortlist) button. `SpotlightCard` hover.
- **Works view:** Cosmos-style **masonry** (CSS columns or CSS grid with row spans; 2/3/4 columns) of portfolio pieces with their real aspect ratios (9:16, 16:9, 1:1, 4:5). Minimal chrome. On hover: dim overlay, creator avatar+name, tool chips, content-type icon. Click opens the **Work Lightbox** (same component as profile's piece detail).
- States: skeleton grid while "loading" (short fake delay of 300ms for polish), empty state with "Clear filters" and "Post a brief".

### 7.3 Creator profile `/creators/[slug]`
- **Banner:** `AuroraBackground` tinted with creator's palette. Avatar (large, ring), name, handle, location, headline, verified cluster, **Trust Score** ring (0–100) with popover explaining each signal.
- **Primary actions:** "Invite to a brief" (opens sheet: pick one of your briefs or "Create new brief"), "Shortlist", "Share" (copy link).
- **Sticky sub-nav** with anchors: Portfolio · Workflows · Tools & Skills · Commercial terms · Reviews.
- **Main column:**
  - **Portfolio:** masonry grid of pieces. Each piece tile shows the cover, title, content-type icon, duration/aspect badge, tool chips on hover, a small "Workflow shared" icon if applicable.
  - **Work detail (modal/lightbox):** large media area (`AuroraCover` or real media; if `mediaUrl` is a YouTube link, embed with `youtube-nocookie`; if an mp4 in `/public/media`, a `<video>` with controls). Right panel: title, brand/client (if any), result metric (e.g., "2.1M views"), **"How it was made"** vertical stepper (each step: title, tool chip, short detail), **Prompt example** in a code-style block with copy button, stat tiles (generations, hours, post-production tools), commercial-use note, verified-work mark. Keyboard: left/right arrows to navigate pieces, `Esc` closes.
  - **Tools & Skills:** tool rows (name, category, proficiency bar, years, verified check, commercial-safe chip), skills as chips, specializations, supported formats/aspect ratios, languages.
  - **Commercial terms:** clear table: license types offered (organic social, paid ads, broadcast, internal), ownership (full buyout / license), usage duration options, exclusivity available, AI-disclosure statement, **commercial-safe tools used %** computed from tools, revisions included, turnaround.
  - **Reviews:** 2 seeded testimonials (brand name, quote, rating).
- **Right sticky "Hire card":** starting price, typical turnaround, revisions included, availability, response time, primary CTA "Invite to a brief", secondary "Shortlist".

### 7.4 Brief builder `/briefs/new` (also `/briefs/[id]/edit` reuses the same form)
Two-pane layout on desktop (stacked on mobile):

**Left: Form** (accordion sections with check marks when complete; sticky progress):
1. **Idea & objective:** title, brand name, one-line idea/rough description, campaign objective (Awareness, Launch, Conversion, Education, Brand story), target audience.
2. **Deliverables:** repeatable rows: content type (video, animation, image, graphic, audio, 3D), quantity, aspect ratio (9:16, 16:9, 1:1, 4:5, 21:9), duration (for video/animation/audio), resolution (1080p, 4K).
3. **Style & mood:** mood chips (cinematic, playful, minimalist, surreal, retro-futuristic, hyper-real, hand-drawn, luxury, gritty...), color palette picker (up to 4 swatches), reference links (up to 3), "avoid" notes.
4. **Skills & tools:** required skills (multi-select), preferred tools (multi-select), "Only commercially safe tools" switch.
5. **Commercial use:** usage type (organic social, paid ads, broadcast/TV, internal, all), platforms, territory (India, APAC, Global...), license duration (6 months, 1 year, 3 years, perpetual), exclusivity (none, category, full), ownership (license, full buyout), AI disclosure required (switch), watermark-free (switch), derivative/edit rights (switch).
6. **Budget & timeline:** currency (INR/USD), min/max budget slider, deadline date picker, revision rounds (1–5), start date optional.

**Top of the left pane: the AI Brief Builder card** (`BorderBeam`, gradient heading "Start with a rough idea"):
- Textarea (max 600 chars, with counter) and 4 clickable example prompts.
- Button "Build my brief" (`GradientButton`, sparkle icon).
- On click: staged progress UI (3 animated steps: "Understanding your idea" → "Choosing formats & tools" → "Drafting commercial terms"), then **all form fields fill in with a staggered highlight animation** and a tiny "AI-suggested" sparkle tag on each filled field (tag disappears when the user edits it).
- Shows `source: ai | fallback` quietly (small caption "Drafted by Gemini" or "Drafted by smart templates") so it is honest.
- Error state: if even the fallback fails (shouldn't), toast with retry.

**Right: Live Brief Preview** (sticky): renders the brief like a premium document (title, brand, objective, deliverables table, style chips, palette swatches, commercial-use block, budget/timeline). Above it, a **Completeness meter** (0–100%) with a list of missing/weak fields (click to scroll/focus the field). Publishing requires ≥ 80% and all required fields.

**Actions:** "Save draft", "Publish brief" (→ `/briefs/[id]` with confetti-free subtle success animation).

### 7.5 Brief detail `/briefs/[id]` and list `/briefs`
- `/briefs`: grid of the user's briefs (draft/published) + 2 seeded sample briefs marked "Sample". Empty state if none, with CTA.
- `/briefs/[id]`: header (title, status pill, key chips), tabs:
  - **Matches** (default): ranked creators, each row/card with `MatchRing`, reasons ("Matched: Runway, Kling, Image-to-video · Missing: Lip-sync"), price vs budget indicator, trust score, **Invite** and **Shortlist** buttons. Top match highlighted.
  - **Brief:** the full preview document, Edit button.
  - **Engagements:** pipeline for this brief.

### 7.6 Engagements `/engagements`
- **Kanban board** (columns: Invited, Accepted, In progress, In review, Delivered; Declined collapsed). Cards: creator avatar, brief title, last update, status. Drag-and-drop is **not required** (cut); use action buttons.
- **Engagement detail** (slide-over sheet): vertical activity timeline, actions depending on role and status:
  - Brand: Cancel invite, Request revision (with note), Approve & mark delivered.
  - Creator: Accept, Decline, Start work, Submit for review (adds a deliverable link/note).
- Revision counter vs revisions included. All transitions validated by a pure state machine (Section 11.4).

### 7.7 Join as creator `/creators/new`
Short 4-step wizard (progress bar, animated transitions): Basics → Tools & Skills → Pricing & Commercial terms → First portfolio piece with a workflow (at least one step). Final screen shows a live preview of the profile card and "Publish". The new creator is stored locally and appears in Discover (marked "You"). Reuse the same option lists as filters.

### 7.8 Demo Controls (floating, bottom-right, collapsible)
- Role switch: **Brand view / Creator view** (affects available engagement actions and nav label).
- "Simulate creator accepts latest invite."
- "Load sample briefs" / "Reset demo data" (clears persisted store).
- Small "Demo mode" label so judges understand it.

---

## 8. Data Model

Define in a `types` module and mirror with zod where user input is involved. These shapes are decision-critical: implement them as written (you may add fields, not rename).

```ts
// ---------- Enums / literals ----------
export type ContentType = "video" | "animation" | "image" | "graphic" | "audio" | "3d";
export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5" | "21:9";
export type Resolution = "1080p" | "4K" | "HD" | "Print";
export type ToolCategory = "video" | "image" | "animation" | "audio" | "3d" | "editing" | "upscale" | "llm";
export type Availability = "available" | "limited" | "booked";
export type LicenseUse = "organic-social" | "paid-ads" | "broadcast" | "internal";
export type Ownership = "license" | "full-buyout";
export type Exclusivity = "none" | "category" | "full";
export type Currency = "INR" | "USD";

// ---------- Tools ----------
export interface Tool {
  id: string;                // "runway"
  name: string;              // "Runway"
  category: ToolCategory;
  commerciallySafe: boolean; // illustrative flag in this prototype, NOT legal advice
  color: string;             // hex for chip dot
}

// ---------- Creator ----------
export interface ToolProficiency {
  toolId: string;
  level: 1 | 2 | 3 | 4 | 5;
  yearsUsing: number;
  verified: boolean;         // creator attached proof (simulated in seed data)
}

export interface WorkflowStep {
  title: string;             // "Generate hero shots"
  toolId?: string;
  detail: string;            // 1-2 sentences
}

export interface Workflow {
  summary: string;
  steps: WorkflowStep[];     // >= 3 steps => counts as "workflow shared"
  promptExample?: string;
  generations: number;       // total generations to reach final
  hoursSpent: number;
  postProduction: string[];  // e.g. ["DaVinci Resolve", "Topaz"]
}

export interface PortfolioPiece {
  id: string;
  title: string;
  contentType: ContentType;
  aspectRatio: AspectRatio;
  durationSec?: number;
  year: number;
  palette: string[];         // 3 hex colors for AuroraCover
  mediaUrl?: string;         // youtube url or /media/*.mp4 (optional)
  coverUrl?: string;         // optional real image in /public/media
  toolIds: string[];
  workflow?: Workflow;
  client?: string;           // brand name if commissioned
  result?: string;           // "2.1M views in 2 weeks"
  clientVerified: boolean;   // past work confirmed by the client (simulated)
  commercialUseCleared: boolean;
}

export interface CommercialTerms {
  licensesOffered: LicenseUse[];
  ownershipOptions: Ownership[];
  exclusivityAvailable: Exclusivity[];
  usageDurations: string[];           // ["6 months", "1 year", "perpetual"]
  aiDisclosure: string;               // short statement
  trainingDataStatement: string;      // e.g. "Own LoRAs trained on self-owned photography"
}

export interface Creator {
  id: string;
  slug: string;
  name: string;
  handle: string;
  avatarSeed: string;                 // DiceBear seed
  headline: string;
  bio: string;
  location: string;
  languages: string[];
  specializations: string[];          // from SPECIALIZATIONS list
  skills: string[];                   // from SKILLS list
  tools: ToolProficiency[];
  contentTypes: ContentType[];
  styles: string[];                   // mood words
  formats: AspectRatio[];
  startingPrice: number;
  currency: Currency;
  turnaroundDays: number;
  revisionsIncluded: number;
  availability: Availability;
  responseTimeHours: number;
  rating: number;                     // 0-5
  reviewCount: number;
  projectsCompleted: number;
  commercial: CommercialTerms;
  identityVerified: boolean;
  portfolio: PortfolioPiece[];
  testimonials: { brand: string; quote: string; rating: number }[];
  isUserCreated?: boolean;
}

// ---------- Brief ----------
export interface Deliverable {
  id: string;
  contentType: ContentType;
  quantity: number;
  aspectRatio: AspectRatio;
  durationSec?: number;
  resolution: Resolution;
}

export interface CommercialRequirements {
  usageTypes: LicenseUse[];
  platforms: string[];                // ["Instagram", "YouTube", ...]
  territory: string;                  // "India" | "APAC" | "Global"
  licenseDuration: string;            // "6 months" | "1 year" | "3 years" | "perpetual"
  exclusivity: Exclusivity;
  ownership: Ownership;
  aiDisclosureRequired: boolean;
  watermarkFree: boolean;
  derivativeRights: boolean;
  commerciallySafeToolsOnly: boolean;
}

export interface Brief {
  id: string;
  status: "draft" | "published";
  title: string;
  brandName: string;
  idea: string;                       // the rough one-liner
  objective: "awareness" | "launch" | "conversion" | "education" | "brand-story";
  audience: string;
  deliverables: Deliverable[];
  moods: string[];
  palette: string[];                  // up to 4 hex
  references: string[];               // up to 3 urls
  avoid: string;
  requiredSkills: string[];
  preferredToolIds: string[];
  commercial: CommercialRequirements;
  budget: { min: number; max: number; currency: Currency };
  deadline: string;                   // ISO date
  revisionRounds: number;
  createdAt: string;
  isSample?: boolean;
}

// ---------- Engagement ----------
export type EngagementStatus =
  | "invited" | "accepted" | "declined" | "in_progress"
  | "in_review" | "revision_requested" | "delivered" | "cancelled";

export interface EngagementEvent {
  at: string;                         // ISO
  actor: "brand" | "creator" | "system";
  type: EngagementStatus | "note";
  note?: string;
}

export interface Engagement {
  id: string;
  briefId: string;
  creatorId: string;
  status: EngagementStatus;
  revisionsUsed: number;
  events: EngagementEvent[];
}
```

**Master lists** (single source of truth in a `constants` module, used by seed data, filters, forms, and the AI schema):
- **Specializations:** AI Filmmaker, AI Animator, Product Ads, Fashion & Lookbooks, Music Videos, Character Design, Motion Graphics, Social Shorts, Brand Identity, Architecture Viz, Game Assets, Explainer Videos.
- **Skills:** Prompt Engineering, ComfyUI Pipelines, LoRA Training, Image-to-Video, Video-to-Video, Lip-Sync, Character Consistency, Storyboarding, Color Grading, Sound Design, Upscaling, Inpainting, Motion Tracking, 3D Compositing, Voice Cloning, Music Generation.
- **Tools** (seed ~22, each with category, color, `commerciallySafe` flag): Runway, Kling, Veo, Sora, Luma Dream Machine, Pika, Hailuo, Higgsfield, Midjourney, Flux, Stable Diffusion / ComfyUI, Adobe Firefly (safe), Ideogram, Leonardo, Krea, Magnific (upscale), Topaz (upscale), ElevenLabs, Suno, DaVinci Resolve (editing), After Effects (editing), Blender (3D). Flag Adobe Firefly and tools with self-trained models as `commerciallySafe: true`; mark others per a sensible illustrative default and add a UI footnote: "Commercial-safety flags are illustrative in this prototype; always verify each tool's license."
- **Moods:** cinematic, playful, minimalist, surreal, retro-futuristic, hyper-real, hand-drawn, luxury, gritty, dreamy, high-energy, documentary.
- **Platforms:** Instagram, YouTube, TikTok, LinkedIn, Facebook, X, Connected TV, Out-of-home, Website.

---

## 9. Verification Signals (Bonus)

Compute from data with **pure functions** (so they are real logic, unit-tested), not hardcoded UI flags.

Four signals per creator:
1. **Tools Verified:** ratio of the creator's tools with `verified: true`. Earned badge if ≥ 60% of listed tools verified (and ≥ 2 tools).
2. **Workflow Shared:** ratio of portfolio pieces whose `workflow.steps.length ≥ 3`. Badge if ≥ 50% of pieces (and ≥ 2 pieces).
3. **Past Work Verified:** count of pieces with `clientVerified`. Badge if ≥ 2.
4. **Identity Verified:** `identityVerified`.

**Trust Score (0–100):** Tools 30 + Workflow 30 + Past work 25 + Identity 15, each scaled by its ratio (past work: min(count,4)/4). Display as a ring with a popover breakdown showing earned/not earned per signal and *what proof earns it* ("Attach project files or a screen recording", "Add a 3+ step workflow to your pieces", "Client confirms delivery", "ID check").

**Honesty note in UI footer of the popover:** "In this prototype, proofs are simulated from seed data. In production these would be backed by uploaded project files, screen recordings, C2PA Content Credentials and client confirmations."

---

## 10. AI Brief Builder (Bonus) — Spec

**Route:** `POST /api/brief-builder`
**Input (zod):** `{ idea: string (10–600 chars) }`
**Output (zod):** `{ brief: BriefDraft, source: "ai" | "fallback" }` where `BriefDraft` is the Brief fields minus `id/status/createdAt`, with every enum constrained to the master lists.

**Behavior:**
1. Validate input. Reject with 400 on invalid.
2. If `GEMINI_API_KEY` exists, call Gemini's `generateContent` REST endpoint server-side with an **8-second timeout** (AbortController). Header `x-goog-api-key`. Body uses `generationConfig.responseMimeType = "application/json"` and a `responseSchema` matching `BriefDraft`. Model name from env `GEMINI_MODEL` with a sensible free-tier default (e.g. a current Flash model); if the API rejects the model name, check the current model list in the docs and update the default. System instruction: *"You are a senior creative producer for AI-generated content. Convert the rough idea into a complete structured brief. Choose ONLY from the allowed values provided. Be specific and realistic. Default currency INR for India-sounding briefs else USD. Never include commentary, only JSON."* Include the allowed lists (skills, tools, moods, platforms, enums) in the prompt.
3. Parse JSON, validate with the zod schema, **sanitize** (drop unknown enum values, clamp numbers, cap array lengths). If invalid → fallback.
4. **Fallback generator (pure function, deterministic):** keyword rules on the idea text. Examples: contains "instagram|reel|tiktok|shorts" → platforms + 9:16 video 15s; "youtube|film|trailer" → 16:9; "poster|image|banner" → image 4:5 or 1:1; "product|launch|ad" → objective launch + paid-ads usage; "luxury|premium" → luxury mood; "cartoon|animated" → animation + hand-drawn mood; detect duration numbers ("15 second", "30s"); detect budget ("under 50k", "$2000"). Always fill every required field with sensible defaults (deadline = today + 14 days, revisions = 2, etc.). Returns `source: "fallback"`.
5. **Best-effort rate limit:** in-memory map per IP, max 8 requests/minute (note: serverless instances are ephemeral, so this is a soft guard). On exceed → 429 with friendly message, and the UI falls back to the local fallback generator client-side so the demo still works.
6. Never expose the key. Never log the idea text.

**Env vars:** `GEMINI_API_KEY` (server only, **never** `NEXT_PUBLIC_`), `GEMINI_MODEL` (optional). Provide `.env.example`.

---

## 11. Core Logic Modules (pure, framework-free, fully unit-tested)

### 11.1 Search and filter engine
`filterCreators(creators, filters, query)` and `filterWorks(creators, filters, query)`:
- Normalize text (lowercase, strip accents). Query tokens must **all** match somewhere in name/headline/specializations/skills/tool names (AND of tokens).
- Group semantics as defined in 7.2. Budget filter compares creator `startingPrice` (converted via a fixed demo FX rate INR↔USD, e.g. 1 USD = 85 INR, defined as a constant) to the selected range. Turnaround filter: `≤ N days`. "Verified only" = trust score ≥ 70. "Commercial-safe only" = every tool in the creator's list is `commerciallySafe` OR at least 70% of tools by weight; choose **≥ 70% of listed tools are safe** and document it.
- Returns results plus per-filter option counts (facet counts) for the popovers.
- Sorting helpers (best match, rating, price, turnaround, verified).

### 11.2 Matching engine
`scoreCreatorForBrief(creator, brief) → { score: 0–100, reasons: { matched: string[]; missing: string[]; notes: string[] } , breakdown }`

Weights (sum 100):
- **Skills overlap 25:** matched required skills / total required (if none required, full score).
- **Content type 20:** share of brief deliverable types the creator supports.
- **Tools 15:** preferred tools the creator knows (weighted by proficiency level/5). If none preferred, full score.
- **Style/specialization 15:** overlap between brief moods and creator styles, plus bonus if specialization aligns with objective (e.g., "Product Ads" for launch).
- **Format experience 10:** share of deliverable aspect ratios in creator's `formats` and portfolio.
- **Budget fit 10:** 10 if creator starting price ≤ brief max, tapering to 0 at 2× the max.
- **Commercial compatibility 5:** requested usage types ⊆ creator's `licensesOffered`; ownership/exclusivity supported.
- **Verification bonus:** up to +5 from trust score (score ≥ 80 → +5; ≥ 60 → +3), capped total at 100.
- **Hard filter:** if `commerciallySafeToolsOnly` and creator fails the commercial-safe rule, apply a −25 penalty and add a note (do not remove them; show why).
- Reasons list: human-readable strings for matched/missing items (max 3 each shown in UI).

`rankCreatorsForBrief(creators, brief)` returns sorted by score then trust score.

### 11.3 Brief completeness
`getBriefCompleteness(brief) → { percent, missing: { field: string; label: string }[] }` with weighted required fields (title, brandName, idea, objective, audience, ≥1 deliverable with all fields, ≥1 mood, ≥1 required skill, usageTypes, platforms, license duration, budget, deadline). Publishing requires percent ≥ 80 and no missing *required-to-publish* fields (title, ≥1 deliverable, commercial usage types, budget, deadline).

### 11.4 Engagement state machine
Pure transition map with role checks:
- `invited` → `accepted` | `declined` (creator), → `cancelled` (brand)
- `accepted` → `in_progress` (creator)
- `in_progress` → `in_review` (creator)
- `in_review` → `delivered` (brand) | `revision_requested` (brand; increments `revisionsUsed`)
- `revision_requested` → `in_review` (creator)
- Terminal: `delivered`, `declined`, `cancelled`.
`transition(engagement, to, actor, note?) → Engagement | Error` with the event appended. If `revisionsUsed` would exceed the brief's `revisionRounds`, return a typed error ("Revision limit reached") and show it in the UI.

### 11.5 Verification
`getVerificationSignals(creator)` and `getTrustScore(creator)` per Section 9.

### 11.6 Procedural cover art
`getAuroraCoverStyle(seed, palette)` returns deterministic positions/sizes for gradient blobs using a small string-hash PRNG (no `Math.random` so SSR and client match; avoids hydration errors).

---

## 12. Seed Data (write all of this; fictional people)

**Creators (10).** 4–6 portfolio pieces each. The first 6 must have **full workflows (3–5 steps), prompt examples, generations and hours** on at least 3 pieces; the rest on at least 1. Vary aspect ratios and content types so the masonry looks rich. Fill `palette` with 3 distinct, tasteful hex colors per piece (varied per creator: not all purple).

| # | Name | Location | Specialization(s) | Key tools | Content types | Starting price | Notable |
|---|---|---|---|---|---|---|---|
| 1 | Aarav Mehta | Mumbai | AI Filmmaker, Music Videos | Runway, Kling, Veo, DaVinci Resolve | video | ₹60,000 | Fully verified (trust 90+), cinematic |
| 2 | Zoya Khan | Delhi | Product Ads, Social Shorts | Higgsfield, Kling, Midjourney, ElevenLabs | video, image | ₹35,000 | Strong 9:16, fast turnaround (3d) |
| 3 | Maya Chen | Singapore | AI Animator, Character Design | ComfyUI, Flux, Pika, After Effects | animation, image | $900 | LoRA training, hand-drawn style |
| 4 | Lucas Ferreira | Lisbon | Fashion & Lookbooks, Brand Identity | Midjourney, Firefly, Magnific, Topaz | image, graphic | $700 | Commercially-safe stack, luxury mood |
| 5 | Priya Nair | Bengaluru | Explainer Videos, Motion Graphics | Veo, After Effects, ElevenLabs, Runway | video, audio | ₹40,000 | Lip-sync, voice, education |
| 6 | Omar Haddad | Dubai | Architecture Viz, Product Ads | Midjourney, Luma, Blender, Krea | image, video, 3d | $1,200 | 21:9 and 16:9 specialist |
| 7 | Sofia Rossi | Milan | Fashion & Lookbooks, Music Videos | Sora, Runway, Suno, DaVinci | video, audio | $1,100 | Surreal/dreamy style |
| 8 | Kenji Watanabe | Tokyo | AI Animator, Game Assets | ComfyUI, Stable Diffusion, Blender, Leonardo | animation, 3d, image | $850 | Character consistency |
| 9 | Ananya Iyer | Chennai | Social Shorts, Brand Identity | Ideogram, Flux, CapCut-style editing (use After Effects), Kling | video, graphic | ₹25,000 | Budget-friendly, rising |
| 10 | Noah Williams | Austin | AI Filmmaker, Explainer Videos | Veo, Sora, ElevenLabs, DaVinci | video, audio | $1,500 | Documentary, 16:9, partially verified (trust ~55) |

Give each a believable one-line headline, 2–3 sentence bio, 2 testimonials, rating 4.4–5.0, and realistic `projectsCompleted`. Vary verification so the filter and score visibly differ (some at 90+, some ~55, one ~35).

**Sample briefs (2, `isSample: true`, published):**
1. *"Neon Run: sneaker launch teaser"*: a 15s 9:16 video ×2 and a 16:9 hero image, cinematic + high-energy, paid ads + organic social, Instagram/YouTube/TikTok, India, 6 months, 2 revisions, ₹60,000–₹1,20,000.
2. *"Brew & Bloom: café brand story"*: 30s 16:9 animation + 4 1:1 posters, hand-drawn + playful, organic social + website, full buyout, commercially-safe tools only, $800–$1,800.

**Media strategy:** All pieces render with `AuroraCover` by default (zero external dependencies, always loads). Avatars via DiceBear (`https://api.dicebear.com/9.x/notionists/svg?seed=<avatarSeed>`; add the host to Next image `remotePatterns` or use plain `<img>`). If the owner later adds real media to `/public/media`, `coverUrl`/`mediaUrl` take precedence automatically. No remote stock photo URLs (they break).

---

## 13. Architecture and Suggested Structure

```
src/
  app/
    layout.tsx, globals.css, page.tsx            # landing
    creators/page.tsx, creators/[slug]/page.tsx, creators/new/page.tsx
    briefs/page.tsx, briefs/new/page.tsx, briefs/[id]/page.tsx, briefs/[id]/edit/page.tsx
    engagements/page.tsx
    api/brief-builder/route.ts
  components/
    ui/                  # shadcn primitives
    effects/             # AuroraBackground, SpotlightCard, BorderBeam, Marquee, AuroraCover, NoiseOverlay
    creators/            # CreatorCard, WorkTile, WorkLightbox, FilterBar, TrustRing, VerifiedCluster, ToolChip
    briefs/              # BriefForm sections, BriefPreview, CompletenessMeter, AiBriefBuilder, MatchRow
    engagements/         # Board, EngagementSheet, Timeline
    layout/              # Nav, Footer, CommandPalette, DemoControls
  lib/
    types.ts, constants.ts, schemas.ts           # zod
    filters.ts, matching.ts, completeness.ts, verification.ts, engagement.ts, cover.ts, fallback-brief.ts, format.ts
    store.ts                                     # zustand persist (briefs, engagements, shortlist, userCreator, role)
  data/
    tools.ts, creators.ts, briefs.ts
tests/                                           # mirrors lib + api route
docs/                                            # DATA_MODEL.md, DEMO_SCRIPT.md, SUBMISSION.md
.github/workflows/ci.yml
```

**Rules:** UI components stay thin; all logic lives in `lib/` and is imported by components. Server Components for static pages where possible; Client Components only where interactivity is needed (filters, forms, store). Persisted store must be **hydration-safe** (render skeleton/placeholder until hydrated; use a `useHydrated` hook). `next/image` where useful; lazy-load heavy modals with `dynamic`.

---

## 14. Step-by-Step Implementation Plan

Each phase ends with a **gate** to verify before moving on. Commit after every gate.

**Phase 0 — Scaffold (do first)**
- Create the Next.js app (TypeScript, Tailwind, ESLint, App Router, `src/` dir, npm). Install: `motion`, `lucide-react`, `zustand`, `zod`, `react-hook-form`, `@hookform/resolvers`, `clsx`, `tailwind-merge`, `class-variance-authority`, `sonner`, `date-fns`; dev: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `jsdom`, `prettier`.
- Init shadcn and add in one command: button, badge, input, textarea, select, dialog, sheet, tabs, tooltip, popover, command, slider, checkbox, switch, accordion, dropdown-menu, skeleton, separator, progress, scroll-area, label, calendar, sonner.
- Set up fonts, CSS variables (Section 5.2), dark-only `<html className="dark">`, noise overlay, base styles, `.env.example`, Vitest config with coverage thresholds (80% for `src/lib`), `npm run test`, `npm run typecheck`.
- *Why first:* everything else depends on tokens, fonts and tooling.
- **Gate:** `npm run build` passes; blank page shows the dark background with grain and Geist font.

**Phase 1 — Design system components**
- Build all effects in 5.3 and base components: `Nav`, `Footer`, `GradientButton`, `SpotlightCard`, `ToolChip`, `Badge` variants, `TrustRing`/`MatchRing`, `VerifiedCluster`, `AuroraCover`, `Marquee`, `NoiseOverlay`, `AuroraBackground`, skeletons, empty-state component.
- **Pitfall:** `AuroraCover` must be deterministic (no `Math.random`) or hydration will fail.
- **Gate:** a temporary `/dev` showcase route (delete before final) renders every component; visually confirm polish.

**Phase 2 — Types, constants, seed data**
- Write `types.ts`, `constants.ts`, `schemas.ts`, `tools.ts`, `creators.ts` (all 10), `briefs.ts` (2 samples) exactly per Sections 8 and 12.
- **Gate:** typecheck passes; a quick script/test asserts every `toolId`, skill, specialization in seed data exists in the master lists.

**Phase 3 — Pure logic + tests**
- Implement `filters.ts`, `matching.ts`, `completeness.ts`, `verification.ts`, `engagement.ts`, `fallback-brief.ts`, `cover.ts`, `format.ts` per Section 11, and write their Vitest tests right away (Section 15).
- *Why now:* the UI phases can then rely on correct, tested logic and spend no tokens debugging it.
- **Gate:** `npm run test` green; coverage ≥ 80% on `src/lib`.

**Phase 4 — Store + app shell**
- `store.ts` (Zustand persist): `briefs`, `engagements`, `shortlist`, `userCreator`, `role`, `activeBriefId`, actions, `resetDemo`, `useHydrated`.
- Root layout with Nav, `CommandPalette`, `DemoControls`, toaster, page transitions.
- **Gate:** navigation works; role switch persists after refresh; reset clears.

**Phase 5 — Discover (`/creators`)**
- Filter bar with popovers and facet counts, search, sort, URL sync, Creators/Works toggle, `CreatorCard`, masonry Works view, `WorkLightbox`, states, "match for brief" selector, shortlist toggle.
- **Gate:** combine at least 3 filters, refresh the page (filters persist via URL), counts correct, masonry looks like Cosmos, no layout shift.

**Phase 6 — Creator profile (`/creators/[slug]`)**
- Static params for all seed creators (and client-side lookup for user-created). All sections in 7.3, lightbox with keyboard navigation, invite sheet.
- **Gate:** every seed creator's page renders without errors; workflow stepper and prompt copy work.

**Phase 7 — Brief builder + AI**
- Form sections with react-hook-form + zod, live preview, completeness meter, `AiBriefBuilder` UI with staged progress and field-fill animation, API route (Section 10), fallback client path.
- **Gate:** with **no** `GEMINI_API_KEY`, "Build my brief" still returns a complete brief (`source: fallback`); with a key it returns `source: ai`; publishing blocked below the threshold; publish creates a brief and redirects.

**Phase 8 — Brief detail, matching, engagements**
- `/briefs`, `/briefs/[id]` Matches tab with `MatchRow`, invite flow, `/engagements` board + sheet, role-aware actions, "simulate creator accepts".
- **Gate:** invite → (creator view) accept → start → submit → (brand view) request revision → submit → approve works end to end; revision limit error appears.

**Phase 9 — Join as creator (`/creators/new`)**
- 4-step wizard + preview; new creator appears in Discover with a "You" tag and is filterable.
- **Gate:** created creator shows up and has a working profile page.

**Phase 10 — Landing page (`/`)**
- All sections in 7.1 with animations. Do this late so the real components/data exist to showcase.
- **Gate:** hero is jaw-dropping on desktop and clean on mobile (check 375px width).

**Phase 11 — Polish, docs, CI, deploy**
- Remove `/dev` route. Add page metadata, `opengraph-image` (generated aurora), favicon, 404 page. Lighthouse-minded checks: no layout shift, images sized, fonts swapped.
- Accessibility pass: focus rings, labels, tooltips keyboard-accessible, `aria-live` on result count and AI progress.
- Write docs (Section 16), CI workflow, README.
- Deploy: push public repo to GitHub, import in Vercel, set `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`) in Project Settings → Environment Variables, deploy, open the live URL and run the demo script once.
- **Gate:** `lint`, `typecheck`, `test`, `build` all pass in CI; the live URL works on mobile and desktop.

---

## 15. Testing Decisions

**What makes a good test here:** test external behavior of pure functions and the API route (inputs → outputs), not component internals. No snapshot spam.

Tests to write (Vitest):
- `filters`: query tokenization/accents; AND across groups; OR within tools; **skills AND**; budget with FX conversion; turnaround; verified-only; commercial-safe ≥70%; facet counts; empty results.
- `matching`: perfect match ≈ high score; missing skills lowers score and appears in `missing`; budget taper; commercial-safe penalty; verification bonus cap; ranking order and tie-break.
- `verification`: each signal threshold edge cases; trust score weights; creator with no portfolio.
- `completeness`: empty brief 0%; fully filled 100%; publish gating.
- `engagement`: every allowed transition; every forbidden transition returns an error; revision limit.
- `fallback-brief`: keyword rules (Instagram → 9:16, "15 second" → 15s, budget parsing), always returns a schema-valid brief for random/gibberish input.
- `schemas`/`api route`: valid input → 200 with schema-valid output (mock `fetch` for Gemini); invalid input → 400; Gemini failure/timeout/invalid JSON → fallback with `source: "fallback"`; missing key → fallback; rate limit → 429.
- `cover`: same seed → same output.
- One or two lightweight component tests (e.g., `CompletenessMeter` renders missing fields; `TrustRing` shows score).

Coverage: configure thresholds ≥ 80% lines for `src/lib`. Also manually verify the demo flow once before submission.

**CI (`.github/workflows/ci.yml`):** on push/PR: checkout, setup Node LTS, `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test -- --coverage`, `npm run build`.

---

## 16. Deliverables Checklist (hackathon submission)

Create these files (short, scannable, human-written):

1. **`README.md`**: tagline, screenshot placeholders, live URL placeholder, features, tech stack, how to run locally, env vars, architecture overview (3–5 bullets), design decisions, how verification and matching work (short), testing, limitations/next steps.
2. **`docs/DATA_MODEL.md`** (the required "short note on the profile and brief data model"): one page. Entity overview (Creator, PortfolioPiece, Workflow, Tool, Brief, Deliverable, CommercialRequirements, Engagement), a compact table of key fields for **tools, skills, formats, commercial-use fields**, relationships diagram in a Mermaid block, and 4–5 bullets on why the model is designed this way (workflow as first-class data, structured commercial terms, derived verification).
3. **`docs/DEMO_SCRIPT.md`**: a **2-minute demo script** with timestamps (0:00 problem, 0:15 landing, 0:30 discover with 3 filters + works view, 0:55 profile workflow + trust score, 1:15 AI brief builder from a one-liner, 1:35 matches + invite, 1:50 engagement pipeline, 2:00 close) plus a **5-slide outline** (Problem, Solution, Product tour, Tech & data model, Roadmap) for a few slides if they prefer.
4. **`docs/SUBMISSION.md`**: ready-to-paste text for the submission form: project name, a 120-word description, live URL placeholder, repo placeholder, and **Test access and evaluation notes** ("No login needed. Use the Demo Controls panel (bottom-right) to switch between Brand and Creator views, simulate acceptance, and reset data. The AI Brief Builder uses Gemini with an automatic fallback so it always responds. Try this idea: …").
5. Working prototype hosted on Vercel; public GitHub repo with CI badge.

---

## 17. Non-Functional Requirements

- **Performance:** Lighthouse Performance ≥ 90 on landing and discover (desktop). No heavy dependencies; lazy-load lightbox and wizard. Use CSS for effects, not canvas/WebGL.
- **Accessibility:** keyboard navigable, visible focus, AA contrast, reduced motion respected.
- **Responsive:** 375px, 768px, 1280px+ verified.
- **Security:** key only on the server; `.env*` git-ignored; no secrets in repo; sanitize/validate all API input; no `dangerouslySetInnerHTML`.
- **Resilience:** the AI feature and every page must work with zero network access to external services (except DiceBear avatars, which fall back to initials in a gradient circle on error).
- **Free-tier safety:** no paid services. Vercel Hobby, Gemini free tier, GitHub free.

---

## 18. Out of Scope (do NOT build)

Real authentication, payments/escrow, real messaging/chat, file uploads or video hosting, a real database, email/notifications, real tool-verification (proofs are simulated), drag-and-drop kanban, light theme, i18n, admin panel, analytics, real C2PA validation, multi-currency live FX.

**Cut order if tokens/time run short** (cut from the top first): (1) BorderBeam and landing mini-visuals, (2) `⌘K` command palette, (3) Join-as-creator wizard, (4) Works masonry view on Discover (keep Creators view; keep masonry inside profiles), (5) engagement kanban (keep a simple list). **Never cut:** profiles with workflows, structured brief form, search/filters, matching, AI Brief Builder with fallback, verification signals, docs, deploy.

---

## 19. Final Acceptance Checklist

- [ ] Live Vercel URL works with no login; public GitHub repo with CI passing.
- [ ] Creator profile shows tools (with proficiency/verified), skills, specialization, formats, commercial terms, and a portfolio with **workflow breakdowns**.
- [ ] Brief includes content type, style/mood, aspect ratio, duration, platforms, budget, timeline, revisions, and full commercial-use requirements.
- [ ] Discover: combined filters (tool, skill, specialization, content type, format, budget, verified, commercial-safe), search, sort, URL-synced, Creators and Works views, accurate results.
- [ ] Matching shows score + reasons for each brief.
- [ ] Verification badges + trust score visible on cards and profiles, computed from data.
- [ ] AI Brief Builder works with and without an API key.
- [ ] Invite → accept → deliver flow works through the Demo Controls role switch.
- [ ] UI feels premium: aurora/spotlight/noise effects, serif accent type, masonry, smooth motion, no visual bugs at 375px.
- [ ] README, DATA_MODEL, DEMO_SCRIPT, SUBMISSION docs written. Tests pass with ≥ 80% lib coverage.

**Start now with Phase 0. Work through the phases in order, commit after each gate, and keep replies short.**
