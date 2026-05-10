import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appLog } from "./appLog";

describe("appLog", () => {
  beforeEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes to console when electronAPI is missing", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    appLog("info", "TestScope", "hello");
    expect(log).toHaveBeenCalledWith("[TestScope] hello", "");
    log.mockRestore();
  });

  it("invokes writeLog when electronAPI is present", async () => {
    const writeLog = vi.fn().mockResolvedValue(undefined);
    window.electronAPI = { writeLog } as unknown as NonNullable<
      Window["electronAPI"]
    >;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    appLog("warn", "X", "y", { n: 1 });
    expect(writeLog).toHaveBeenCalledWith({
      level: "warn",
      scope: "X",
      message: "y",
      meta: { n: 1 },
    });
    expect(log).toHaveBeenCalledWith("[X] y", '{"n":1}');
    log.mockRestore();
  });

  it("uses console.warn and console.error for levels", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    appLog("warn", "A", "b");
    appLog("error", "A", "c");
    appLog("debug", "A", "d");
    expect(warn).toHaveBeenCalled();
    expect(err).toHaveBeenCalled();
    warn.mockRestore();
    err.mockRestore();
  });
});
