import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDayGuidance } from "./useDayGuidance";

describe("useDayGuidance", () => {
  it("returns guidance for an authored day", () => {
    const { result } = renderHook(() => useDayGuidance(2, 1));
    expect(result.current?.week).toBe(2);
    expect(result.current?.day).toBe(1);
  });

  it("returns undefined for missing day", () => {
    const { result } = renderHook(() => useDayGuidance(50, 9));
    expect(result.current).toBeUndefined();
  });

  it("updates when week/day change", () => {
    const { result, rerender } = renderHook(
      ({ w, d }: { w: number; d: number }) => useDayGuidance(w, d),
      { initialProps: { w: 2, d: 1 } },
    );
    expect(result.current?.day).toBe(1);
    rerender({ w: 2, d: 2 });
    expect(result.current?.day).toBe(2);
  });
});
