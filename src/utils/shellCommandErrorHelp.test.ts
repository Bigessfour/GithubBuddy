import { describe, it, expect } from "vitest";
import {
  getCommandErrorHelp,
  formatCommandErrorHelpForLog,
} from "./shellCommandErrorHelp";

describe("getCommandErrorHelp", () => {
  it("returns workspace guidance for not a git repository", () => {
    const h = getCommandErrorHelp(
      "fatal: not a git repository (or any of the parent directories): .git",
      128,
    );
    expect(h?.title).toMatch(/not a Git repository/i);
    expect(h?.steps.some((s) => s.includes("Workspace"))).toBe(true);
  });

  it("returns SSH guidance for publickey errors", () => {
    const h = getCommandErrorHelp(
      "git@github.com: Permission denied (publickey).",
      128,
    );
    expect(h?.title).toMatch(/SSH/i);
  });

  it("returns null for unrecognized errors without exit 128 fatal pattern", () => {
    expect(getCommandErrorHelp("something random", 1)).toBeNull();
  });

  it("formatCommandErrorHelpForLog includes steps", () => {
    const block = formatCommandErrorHelpForLog("fatal: not a git repository", 128);
    expect(block).toMatch(/What to try/i);
    expect(block).toMatch(/Workspace/i);
  });
});
