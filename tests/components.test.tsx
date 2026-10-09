// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompletenessMeter } from "@/components/briefs/completeness-meter";
import { ScoreRing } from "@/components/creators/bits";
import { getBriefCompleteness } from "@/lib/completeness";
import { generateFallbackBrief } from "@/lib/fallback-brief";

afterEach(cleanup);

describe("CompletenessMeter", () => {
  it("lists missing fields and jumps to them", () => {
    const brief = { ...generateFallbackBrief("A 15s instagram reel for a sneaker launch"), title: "", deadline: "" };
    const onJump = vi.fn();
    render(<CompletenessMeter completeness={getBriefCompleteness(brief)} onJump={onJump} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("84");
    fireEvent.click(screen.getByRole("button", { name: /Brief title/ }));
    expect(onJump).toHaveBeenCalledWith("title");
    expect(screen.getByText(/Publishing needs 80%/)).toBeTruthy();
  });

  it("shows the ready state when complete", () => {
    render(<CompletenessMeter completeness={getBriefCompleteness(generateFallbackBrief("A 15s instagram reel for a sneaker launch"))} />);
    expect(screen.getByText(/Ready to publish/)).toBeTruthy();
  });
});

describe("ScoreRing", () => {
  it("shows the score with an accessible label", () => {
    render(<ScoreRing value={87} label="Trust score" />);
    expect(screen.getByRole("img", { name: "Trust score 87 out of 100" }).textContent).toBe("87");
  });
});
