import { describe, it, expect } from "vitest";
import {
  DEFAULT_UPSTREAM_REPO,
  resolveValidatedUpstreamUrl,
} from "./upstreamRepoUrl";

describe("resolveValidatedUpstreamUrl", () => {
  it("uses default when null or blank", () => {
    expect(resolveValidatedUpstreamUrl(null)).toEqual({
      ok: true,
      url: DEFAULT_UPSTREAM_REPO,
    });
    expect(resolveValidatedUpstreamUrl("")).toEqual({
      ok: true,
      url: DEFAULT_UPSTREAM_REPO,
    });
    expect(resolveValidatedUpstreamUrl("   ")).toEqual({
      ok: true,
      url: DEFAULT_UPSTREAM_REPO,
    });
  });

  it("accepts canonical HTTPS GitHub URLs", () => {
    expect(
      resolveValidatedUpstreamUrl(
        "https://github.com/CodePlatoon/aico-echo.git",
      ),
    ).toEqual({
      ok: true,
      url: "https://github.com/CodePlatoon/aico-echo.git",
    });
    expect(
      resolveValidatedUpstreamUrl("https://github.com/CodePlatoon/aico-echo"),
    ).toEqual({
      ok: true,
      url: "https://github.com/CodePlatoon/aico-echo",
    });
  });

  it("accepts git@ and ssh:// forms", () => {
    expect(
      resolveValidatedUpstreamUrl("git@github.com:CodePlatoon/aico-echo.git"),
    ).toEqual({ ok: true, url: "git@github.com:CodePlatoon/aico-echo.git" });
    expect(
      resolveValidatedUpstreamUrl(
        "ssh://git@github.com/CodePlatoon/aico-echo.git",
      ),
    ).toEqual({
      ok: true,
      url: "ssh://git@github.com/CodePlatoon/aico-echo.git",
    });
  });

  it("rejects non-GitHub hosts", () => {
    const r = resolveValidatedUpstreamUrl("https://gitlab.com/foo/bar.git");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/github\.com/i);
  });

  it("rejects nonsense and typos that are not valid remotes", () => {
    expect(resolveValidatedUpstreamUrl("not-a-url").ok).toBe(false);
    expect(resolveValidatedUpstreamUrl("https://github.com/onlyone").ok).toBe(
      false,
    );
  });

  it("rejects shell metacharacters (injection-safe)", () => {
    expect(
      resolveValidatedUpstreamUrl("https://github.com/a/b.git; rm -rf /").ok,
    ).toBe(false);
    expect(
      resolveValidatedUpstreamUrl("https://github.com/a/b`whoami`.git").ok,
    ).toBe(false);
    expect(
      resolveValidatedUpstreamUrl("https://github.com/a/$(whoami).git").ok,
    ).toBe(false);
    expect(resolveValidatedUpstreamUrl("https://github.com/a/b\0.git").ok).toBe(
      false,
    );
  });

  it("rejects path traversal patterns", () => {
    expect(
      resolveValidatedUpstreamUrl("https://github.com/../evil/repo.git").ok,
    ).toBe(false);
  });
});
