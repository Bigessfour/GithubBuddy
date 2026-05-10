import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";

describe("main.tsx bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders App into #root when present", async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import("./main.tsx");
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/GithubBuddy/i);
    });
  });

  it("logs fatal when #root is missing", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await import("./main.tsx");
    expect(err).toHaveBeenCalled();
  });
});
