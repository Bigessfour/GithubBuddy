import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDayFocus } from "./useDayFocus";

vi.mock("../utils/courseContentLoader", () => ({
  loadDayFocus: vi.fn(),
}));

import { loadDayFocus } from "../utils/courseContentLoader";

describe("useDayFocus", () => {
  beforeEach(() => {
    vi.mocked(loadDayFocus).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to loadDayFocus", () => {
    vi.mocked(loadDayFocus).mockReturnValue({
      week: 2,
      day: 3,
      files: [{ name: "a.md", content: "x" }],
    });
    const { result } = renderHook(() => useDayFocus(2, 3));
    expect(result.current?.files[0].name).toBe("a.md");
    expect(loadDayFocus).toHaveBeenCalledWith(2, 3);
  });

  it("returns null when loader returns null", () => {
    const { result } = renderHook(() => useDayFocus(9, 9));
    expect(result.current).toBeNull();
  });
});
