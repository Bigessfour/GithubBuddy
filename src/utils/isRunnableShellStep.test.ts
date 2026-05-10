import { describe, it, expect } from "vitest";
import { isRunnableShellCommand } from "./isRunnableShellStep";

describe("isRunnableShellCommand", () => {
  it("returns false for comment-only commands", () => {
    expect(isRunnableShellCommand("# Open your editor")).toBe(false);
  });

  it("returns true for real commands", () => {
    expect(isRunnableShellCommand("git status")).toBe(true);
  });
});
