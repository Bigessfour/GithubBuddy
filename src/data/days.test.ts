/**
 * Automated tests for the days data layer.
 */

import { describe, it, expect } from "vitest";
import { getDayGuidance, days, buildStandardGithubDayWorkflow } from "./days";

describe("getDayGuidance", () => {
  it("should return guidance for Week 2 Day 4", () => {
    const guidance = getDayGuidance(2, 4);
    expect(guidance).toBeDefined();
    expect(guidance?.week).toBe(2);
    expect(guidance?.day).toBe(4);
    expect(guidance?.steps.length).toBe(9);
  });

  it("should return guidance for Week 2 Days 1–5", () => {
    for (const d of [1, 2, 3, 4, 5]) {
      const g = getDayGuidance(2, d);
      expect(g).toBeDefined();
      expect(g!.week).toBe(2);
      expect(g!.day).toBe(d);
    }
  });

  it("should return undefined for a day that has not been created yet", () => {
    expect(getDayGuidance(99, 99)).toBeUndefined();
  });
});

describe("days invariants", () => {
  it("every authored day has unique step ids and required fields", () => {
    for (const [key, g] of Object.entries(days)) {
      expect(key).toMatch(/^W\d+D\d+$/);
      const ids = g.steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const step of g.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.command.length).toBeGreaterThan(0);
        expect(step.why.length).toBeGreaterThan(0);
        expect(["terminal", "git", "github", "pr"]).toContain(step.category);
      }
      expect(g.bestPractices.length).toBeGreaterThan(0);
    }
  });
});

describe("buildStandardGithubDayWorkflow", () => {
  it("builds consistent structure for arbitrary week/day", () => {
    const g = buildStandardGithubDayWorkflow(10, 3);
    expect(g.week).toBe(10);
    expect(g.day).toBe(3);
    expect(g.steps.map((s) => s.id)).toEqual([
      "s1",
      "s2",
      "s3",
      "s4",
      "s5",
      "s6",
      "s7",
      "s8",
      "s9",
    ]);
  });
});
