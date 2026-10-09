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
export type Objective = "awareness" | "launch" | "conversion" | "education" | "brand-story";
export type Role = "brand" | "creator";

// ---------- Tools ----------
export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  /** Illustrative flag in this prototype, NOT legal advice. */
  commerciallySafe: boolean;
  color: string;
}

// ---------- Creator ----------
export interface ToolProficiency {
  toolId: string;
  level: 1 | 2 | 3 | 4 | 5;
  yearsUsing: number;
  verified: boolean;
}

export interface WorkflowStep {
  title: string;
  toolId?: string;
  detail: string;
}

export interface Workflow {
  summary: string;
  /** >= 3 steps counts as "workflow shared". */
  steps: WorkflowStep[];
  promptExample?: string;
  generations: number;
  hoursSpent: number;
  postProduction: string[];
}

export interface PortfolioPiece {
  id: string;
  title: string;
  contentType: ContentType;
  aspectRatio: AspectRatio;
  durationSec?: number;
  year: number;
  palette: string[];
  mediaUrl?: string;
  coverUrl?: string;
  toolIds: string[];
  workflow?: Workflow;
  client?: string;
  result?: string;
  clientVerified: boolean;
  commercialUseCleared: boolean;
}

export interface CommercialTerms {
  licensesOffered: LicenseUse[];
  ownershipOptions: Ownership[];
  exclusivityAvailable: Exclusivity[];
  usageDurations: string[];
  aiDisclosure: string;
  trainingDataStatement: string;
}

export interface Testimonial {
  brand: string;
  quote: string;
  rating: number;
}

export interface Creator {
  id: string;
  slug: string;
  name: string;
  handle: string;
  avatarSeed: string;
  headline: string;
  bio: string;
  location: string;
  languages: string[];
  specializations: string[];
  skills: string[];
  tools: ToolProficiency[];
  contentTypes: ContentType[];
  styles: string[];
  formats: AspectRatio[];
  startingPrice: number;
  currency: Currency;
  turnaroundDays: number;
  revisionsIncluded: number;
  availability: Availability;
  responseTimeHours: number;
  rating: number;
  reviewCount: number;
  projectsCompleted: number;
  commercial: CommercialTerms;
  identityVerified: boolean;
  portfolio: PortfolioPiece[];
  testimonials: Testimonial[];
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
  platforms: string[];
  territory: string;
  licenseDuration: string;
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
  idea: string;
  objective: Objective;
  audience: string;
  deliverables: Deliverable[];
  moods: string[];
  palette: string[];
  references: string[];
  avoid: string;
  requiredSkills: string[];
  preferredToolIds: string[];
  commercial: CommercialRequirements;
  budget: { min: number; max: number; currency: Currency };
  deadline: string;
  revisionRounds: number;
  createdAt: string;
  isSample?: boolean;
}

export type BriefDraft = Omit<Brief, "id" | "status" | "createdAt" | "isSample">;

// ---------- Engagement ----------
export type EngagementStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "in_progress"
  | "in_review"
  | "revision_requested"
  | "delivered"
  | "cancelled";

export interface EngagementEvent {
  at: string;
  actor: "brand" | "creator" | "system";
  type: EngagementStatus | "note";
  note?: string;
}

export type CollaboratorStatus = "invited" | "accepted" | "declined";

/** Another creator the lead brings onto the same engagement. */
export interface Collaborator {
  creatorId: string;
  /** What they'll do, e.g. "Sound design". */
  role: string;
  /** Share of the fee in percent; the lead keeps the rest. */
  sharePct: number;
  status: CollaboratorStatus;
  invitedAt: string;
}

export interface Engagement {
  id: string;
  briefId: string;
  /** The lead creator the brand invited. */
  creatorId: string;
  status: EngagementStatus;
  revisionsUsed: number;
  events: EngagementEvent[];
  /** Optional so engagements saved before this feature still load. */
  collaborators?: Collaborator[];
}
