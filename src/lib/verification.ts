import { TOOL_MAP } from "@/data/tools";
import { COMMERCIAL_SAFE_THRESHOLD } from "./constants";
import type { Creator, PortfolioPiece } from "./types";

export type SignalKey = "tools" | "workflow" | "pastWork" | "identity";

export interface VerificationSignal {
  key: SignalKey;
  label: string;
  earned: boolean;
  /** 0–1 progress toward the full points for this signal. */
  ratio: number;
  points: number;
  maxPoints: number;
  detail: string;
  proof: string;
}

const WEIGHTS: Record<SignalKey, number> = { tools: 30, workflow: 30, pastWork: 25, identity: 15 };

export function hasWorkflow(piece: PortfolioPiece): boolean {
  return (piece.workflow?.steps.length ?? 0) >= 3;
}

export function getVerificationSignals(creator: Creator): VerificationSignal[] {
  const toolCount = creator.tools.length;
  const verifiedTools = creator.tools.filter((t) => t.verified).length;
  const toolRatio = toolCount ? verifiedTools / toolCount : 0;

  const pieceCount = creator.portfolio.length;
  const workflowPieces = creator.portfolio.filter(hasWorkflow).length;
  const workflowRatio = pieceCount ? workflowPieces / pieceCount : 0;

  const pastWork = creator.portfolio.filter((p) => p.clientVerified).length;
  const pastRatio = Math.min(pastWork, 4) / 4;

  const idRatio = creator.identityVerified ? 1 : 0;

  const make = (key: SignalKey, label: string, ratio: number, earned: boolean, detail: string, proof: string) => ({
    key,
    label,
    ratio,
    earned,
    detail,
    proof,
    maxPoints: WEIGHTS[key],
    points: WEIGHTS[key] * ratio,
  });

  return [
    make(
      "tools",
      "Tools verified",
      toolRatio,
      toolCount >= 2 && toolRatio >= 0.6,
      `${verifiedTools}/${toolCount} tools verified`,
      "Attach project files or a screen recording",
    ),
    make(
      "workflow",
      "Workflow shared",
      workflowRatio,
      pieceCount >= 2 && workflowRatio >= 0.5,
      `${workflowPieces}/${pieceCount} pieces show a 3+ step workflow`,
      "Add a 3+ step workflow to your pieces",
    ),
    make("pastWork", "Past work verified", pastRatio, pastWork >= 2, `${pastWork} client-confirmed pieces`, "Client confirms delivery"),
    make("identity", "Identity verified", idRatio, creator.identityVerified, creator.identityVerified ? "ID checked" : "Not yet checked", "ID check"),
  ];
}

export function getTrustScore(creator: Creator): number {
  return Math.round(getVerificationSignals(creator).reduce((sum, s) => sum + s.points, 0));
}

/** Share of a creator's listed tools flagged commercially safe (0–1). */
export function commercialSafeRatio(creator: Creator): number {
  if (!creator.tools.length) return 0;
  const safe = creator.tools.filter((t) => TOOL_MAP[t.toolId]?.commerciallySafe).length;
  return safe / creator.tools.length;
}

/** Rule: at least 70% of listed tools are flagged commercial-safe. */
export function isCommercialSafe(creator: Creator): boolean {
  return commercialSafeRatio(creator) >= COMMERCIAL_SAFE_THRESHOLD;
}
