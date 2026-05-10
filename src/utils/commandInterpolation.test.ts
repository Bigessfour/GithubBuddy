import { describe, it, expect } from "vitest";
import type { Step } from "../types";
import {
  buildStepCommand,
  hasUnresolvedUpstreamPlaceholder,
} from "./commandInterpolation";

const baseStep = (command: string): Step => ({
  id: "s1",
  title: "t",
  why: "w",
  command,
  category: "git",
});

describe("buildStepCommand", () => {
  it("replaces WEEK, DAY, and BRANCH", () => {
    const step = baseStep("git checkout -b {{BRANCH}}");
    const out = buildStepCommand(step, 2, 4, { upstreamPath: null });
    expect(out).toBe("git checkout -b week2/day4-challenge");
  });

  it("replaces UPSTREAM when path is set", () => {
    const step = baseStep("cp -r {{UPSTREAM}}/week{{WEEK}}/day{{DAY}}/* .");
    const out = buildStepCommand(step, 3, 1, {
      upstreamPath: "/course/aico-echo",
    });
    expect(out).toBe("cp -r /course/aico-echo/week3/day1/* .");
  });

  it("leaves UPSTREAM placeholder when path is missing", () => {
    const step = baseStep("cp {{UPSTREAM}}/x .");
    const out = buildStepCommand(step, 1, 1, { upstreamPath: null });
    expect(out).toBe("cp {{UPSTREAM}}/x .");
    expect(hasUnresolvedUpstreamPlaceholder(out)).toBe(true);
  });
});

describe("hasUnresolvedUpstreamPlaceholder", () => {
  it("returns false when no placeholder", () => {
    expect(hasUnresolvedUpstreamPlaceholder("git status")).toBe(false);
  });
});

describe("buildStepCommand truncation", () => {
  it("truncates extremely long resolved commands", () => {
    const huge = "git status " + "x".repeat(60_000);
    const step = { ...baseStep(huge), command: huge };
    const out = buildStepCommand(step, 1, 1, { upstreamPath: null });
    expect(out.length).toBeLessThanOrEqual(50_000 + 20);
    expect(out).toContain("truncated");
  });
});
