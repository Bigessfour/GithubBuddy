import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

Object.defineProperty(globalThis.navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  configurable: true,
  writable: true,
});

afterEach(() => {
  cleanup();
  const clip = globalThis.navigator.clipboard as unknown as {
    writeText: ReturnType<typeof vi.fn>;
  };
  clip.writeText.mockReset();
  clip.writeText.mockResolvedValue(undefined);
});
