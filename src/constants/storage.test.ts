import { describe, it, expect, beforeEach } from "vitest";
import {
  STORAGE_INTRO_DISMISSED_V1,
  STORAGE_UPSTREAM,
  STORAGE_WORKSPACE,
  isIntroDismissed,
  setIntroDismissed,
} from "./storage";

describe("storage keys", () => {
  it("exports stable localStorage key constants", () => {
    expect(STORAGE_WORKSPACE).toBe("githubbuddy-workspace");
    expect(STORAGE_UPSTREAM).toBe("githubbuddy-upstream-path");
    expect(STORAGE_INTRO_DISMISSED_V1).toBe("githubbuddy-intro-dismissed-v1");
  });
});

describe("intro dismiss flag", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("isIntroDismissed is false until set", () => {
    expect(isIntroDismissed()).toBe(false);
    setIntroDismissed();
    expect(isIntroDismissed()).toBe(true);
    expect(localStorage.getItem(STORAGE_INTRO_DISMISSED_V1)).toBe("1");
  });
});
