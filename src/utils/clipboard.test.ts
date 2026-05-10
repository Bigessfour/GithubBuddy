import { describe, it, expect, vi, afterEach } from "vitest";
import { copyToClipboard } from "./clipboard";

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when writeText succeeds", async () => {
    const spy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(spy).toHaveBeenCalledWith("hello");
  });

  it("returns false when writeText rejects", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(copyToClipboard("x")).resolves.toBe(false);
    expect(err).toHaveBeenCalled();
  });
});
