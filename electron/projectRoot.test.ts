/**
 * @vitest-environment node
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { getAppProjectRoot } from "./projectRoot";

describe("getAppProjectRoot", () => {
  it("resolves to a directory that contains this project's package.json", () => {
    const root = getAppProjectRoot();
    const raw = fs.readFileSync(path.join(root, "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { name?: string };
    expect(pkg.name).toBe("githubbuddy");
  });
});
