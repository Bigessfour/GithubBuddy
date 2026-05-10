import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadDayFocus } from "./courseContentLoader";

describe("loadDayFocus", () => {
  beforeEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  afterEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
    vi.restoreAllMocks();
  });

  it("returns null when not in Electron", () => {
    expect(loadDayFocus(2, 4)).toBeNull();
  });

  it("returns null when getDayFocusContent is missing", () => {
    window.electronAPI = {} as unknown as NonNullable<Window["electronAPI"]>;
    expect(loadDayFocus(2, 4)).toBeNull();
  });

  it("returns content from preload when available", () => {
    const payload = {
      week: 2,
      day: 4,
      files: [{ name: "README.md", content: "# Hi" }],
    };
    window.electronAPI = {
      getDayFocusContent: vi.fn().mockReturnValue(payload),
    } as unknown as NonNullable<Window["electronAPI"]>;
    expect(loadDayFocus(2, 4)).toEqual(payload);
  });

  it("returns null when getDayFocusContent throws", () => {
    window.electronAPI = {
      getDayFocusContent: vi.fn().mockImplementation(() => {
        throw new Error("disk");
      }),
    } as unknown as NonNullable<Window["electronAPI"]>;
    expect(loadDayFocus(1, 1)).toBeNull();
  });

  it("returns null when window is undefined (SSR-safe)", () => {
    const prev = globalThis.window;
    try {
      // @ts-expect-error intentional removal for branch coverage
      delete globalThis.window;
      expect(loadDayFocus(1, 1)).toBeNull();
    } finally {
      globalThis.window = prev;
    }
  });
});
