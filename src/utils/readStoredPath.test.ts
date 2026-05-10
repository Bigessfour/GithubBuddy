import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readStoredPath } from "./readStoredPath";

describe("readStoredPath", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for missing key", () => {
    expect(readStoredPath("missing")).toBeNull();
  });

  it("returns trimmed value", () => {
    localStorage.setItem("k", "  /path  ");
    expect(readStoredPath("k")).toBe("/path");
  });

  it("returns null for whitespace-only", () => {
    localStorage.setItem("k", "   ");
    expect(readStoredPath("k")).toBeNull();
  });

  it("returns null when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(readStoredPath("k")).toBeNull();
  });
});
