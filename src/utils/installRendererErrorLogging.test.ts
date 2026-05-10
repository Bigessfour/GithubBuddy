import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installRendererErrorLogging } from "./installRendererErrorLogging";

vi.mock("./appLog", () => ({
  appLog: vi.fn(),
}));

import { appLog } from "./appLog";

describe("installRendererErrorLogging", () => {
  beforeEach(() => {
    vi.mocked(appLog).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs window error events", () => {
    const dispose = installRendererErrorLogging();
    try {
      window.dispatchEvent(
        new ErrorEvent("error", {
          message: "boom",
          filename: "x.js",
          lineno: 1,
          colno: 2,
          error: new Error("inner"),
        }),
      );
      expect(appLog).toHaveBeenCalledWith(
        "error",
        "Renderer",
        "window.error",
        expect.objectContaining({ message: "boom", filename: "x.js" }),
      );
    } finally {
      dispose();
    }
  });

  it("logs unhandledrejection with Error reason", () => {
    const dispose = installRendererErrorLogging();
    try {
      const err = new Error("rej");
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          promise: Promise.resolve(),
          reason: err,
        }),
      );
      expect(appLog).toHaveBeenCalledWith(
        "error",
        "Renderer",
        "unhandledrejection",
        expect.objectContaining({
          reason: expect.objectContaining({ message: "rej" }),
        }),
      );
    } finally {
      dispose();
    }
  });

  it("logs unhandledrejection with non-Error reason", () => {
    const dispose = installRendererErrorLogging();
    try {
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          promise: Promise.resolve(),
          reason: "x",
        }),
      );
      expect(appLog).toHaveBeenCalledWith(
        "error",
        "Renderer",
        "unhandledrejection",
        { reason: "x" },
      );
    } finally {
      dispose();
    }
  });
});
