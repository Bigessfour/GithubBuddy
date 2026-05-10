import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  writeReadOnlyUpstreamRecord,
  UPSTREAM_RECORD_FILENAME,
} from "./upstreamRecordFile";

describe("upstreamRecordFile", () => {
  let root: string;

  beforeEach(() => {
    root = path.join(
      fs.realpathSync(os.tmpdir()),
      `pc-upstream-record-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    fs.mkdirSync(root, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("writes marker and makes file read-only", () => {
    writeReadOnlyUpstreamRecord(fs, path, root, "https://github.com/o/r.git");
    const p = path.join(root, UPSTREAM_RECORD_FILENAME);
    expect(fs.readFileSync(p, "utf8")).toContain("https://github.com/o/r.git");
    expect(fs.statSync(p).mode & 0o222).toBe(0);
  });

  it("overwrites when previous run left file at 0o444", () => {
    const first = "https://github.com/a/b.git";
    const second = "https://github.com/c/d.git";
    writeReadOnlyUpstreamRecord(fs, path, root, first);
    writeReadOnlyUpstreamRecord(fs, path, root, second);
    const p = path.join(root, UPSTREAM_RECORD_FILENAME);
    const content = fs.readFileSync(p, "utf8");
    expect(content).toContain(second);
    expect(content).not.toContain("github.com/a/b.git");
  });

  it("creates parent directory when missing", () => {
    const nested = path.join(root, "nested", "clone-root");
    writeReadOnlyUpstreamRecord(
      fs,
      path,
      nested,
      "https://github.com/x/y.git",
    );
    expect(
      fs.readFileSync(
        path.join(nested, UPSTREAM_RECORD_FILENAME),
        "utf8",
      ),
    ).toContain("https://github.com/x/y.git");
  });
});
