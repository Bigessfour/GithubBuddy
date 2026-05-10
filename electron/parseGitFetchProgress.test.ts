/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { parseGitFetchProgressPercent } from "./parseGitFetchProgress";

describe("parseGitFetchProgressPercent", () => {
  it("returns null when no percentage", () => {
    expect(parseGitFetchProgressPercent("Cloning into 'x'...")).toBeNull();
  });

  it("parses receiving objects line", () => {
    expect(
      parseGitFetchProgressPercent(
        "Receiving objects:  45% (1234/27382), 1.23 MiB | 100.00 KiB/s",
      ),
    ).toBe(45);
  });

  it("uses last percentage on the line when multiple appear", () => {
    expect(
      parseGitFetchProgressPercent("Resolving deltas: 100% (500/500)"),
    ).toBe(100);
  });

  it("returns null for out-of-range", () => {
    expect(parseGitFetchProgressPercent("bad 101%")).toBeNull();
  });
});
