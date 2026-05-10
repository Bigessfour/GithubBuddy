import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  hasLocalCourseContent,
  getAvailableWeeksAndDays,
  getAvailableWeeks,
  getAvailableDaysForWeek,
} from "./courseScanner";

describe("courseScanner", () => {
  beforeEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  afterEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  it("browser mode: no local content and empty weeks", () => {
    expect(hasLocalCourseContent()).toBe(false);
    expect(getAvailableWeeksAndDays()).toEqual([]);
    expect(getAvailableWeeks()).toEqual([]);
    expect(getAvailableDaysForWeek(2)).toEqual([]);
  });

  it("electron mode: uses preload scan", () => {
    window.electronAPI = {
      getCourseContentScan: vi.fn().mockReturnValue({
        hasLocal: true,
        weeks: [
          { week: 2, days: [1, 2] },
          { week: 3, days: [1] },
        ],
      }),
    } as unknown as NonNullable<Window["electronAPI"]>;
    expect(hasLocalCourseContent()).toBe(true);
    expect(getAvailableWeeksAndDays()).toEqual([
      { week: 2, days: [1, 2] },
      { week: 3, days: [1] },
    ]);
    expect(getAvailableWeeks()).toEqual([2, 3]);
    expect(getAvailableDaysForWeek(2)).toEqual([1, 2]);
    expect(getAvailableDaysForWeek(99)).toEqual([]);
  });

  it("electron without getCourseContentScan: empty scan", () => {
    window.electronAPI = {} as unknown as NonNullable<Window["electronAPI"]>;
    expect(hasLocalCourseContent()).toBe(false);
    expect(getAvailableWeeksAndDays()).toEqual([]);
  });

  it("getCourseContentScan throws: safe fallback", () => {
    window.electronAPI = {
      getCourseContentScan: vi.fn().mockImplementation(() => {
        throw new Error("boom");
      }),
    } as unknown as NonNullable<Window["electronAPI"]>;
    expect(hasLocalCourseContent()).toBe(false);
    expect(getAvailableWeeksAndDays()).toEqual([]);
  });
});
