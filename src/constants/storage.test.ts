import { describe, it, expect } from "vitest";
import { STORAGE_UPSTREAM, STORAGE_WORKSPACE } from "./storage";

describe("storage keys", () => {
  it("exports stable localStorage key constants", () => {
    expect(STORAGE_WORKSPACE).toBe("platoon-companion-workspace");
    expect(STORAGE_UPSTREAM).toBe("platoon-companion-upstream-path");
  });
});
