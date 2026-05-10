/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => "/tmp/app",
    getVersion: () => "0.0.0",
    getPath: () => "/tmp/userData",
  },
}));

import { stringifyLogValue } from "./appFileLogger";

describe("stringifyLogValue", () => {
  it("passes through strings", () => {
    expect(stringifyLogValue("hello")).toBe("hello");
  });

  it("stringifies numbers and booleans", () => {
    expect(stringifyLogValue(42)).toBe("42");
    expect(stringifyLogValue(true)).toBe("true");
  });

  it("serializes plain objects as JSON", () => {
    expect(stringifyLogValue({ x: 1 })).toBe('{"x":1}');
  });

  it("formats Error as name and message", () => {
    expect(stringifyLogValue(new Error("oops"))).toBe("Error: oops");
  });

  it("falls back for circular structures", () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(stringifyLogValue(a)).toBe("[object Object]");
  });
});
