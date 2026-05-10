/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  classifyGitRemoteFailure,
  isGithubHttpsUrl,
  parseGithubHttpsOwnerRepo,
} from "./classifyGitRemoteFailure";

describe("classifyGitRemoteFailure", () => {
  it("returns auth_like for common git HTTPS failure stderr", () => {
    expect(
      classifyGitRemoteFailure("remote: Repository not found."),
    ).toBe("auth_like");
    expect(classifyGitRemoteFailure("fatal: Authentication failed")).toBe(
      "auth_like",
    );
    expect(classifyGitRemoteFailure("terminal prompts disabled")).toBe(
      "auth_like",
    );
  });

  it("returns other for empty or unrelated stderr", () => {
    expect(classifyGitRemoteFailure("")).toBe("other");
    expect(classifyGitRemoteFailure("   ")).toBe("other");
    expect(classifyGitRemoteFailure("fatal: not a git repository")).toBe(
      "other",
    );
  });
});

describe("isGithubHttpsUrl", () => {
  it("accepts github.com HTTPS clone URLs", () => {
    expect(
      isGithubHttpsUrl("https://github.com/CodePlatoon/aico-echo.git"),
    ).toBe(true);
  });

  it("rejects SSH and non-GitHub hosts", () => {
    expect(isGithubHttpsUrl("git@github.com:CodePlatoon/aico-echo.git")).toBe(
      false,
    );
    expect(isGithubHttpsUrl("https://gitlab.com/acme/course.git")).toBe(false);
  });
});

describe("parseGithubHttpsOwnerRepo", () => {
  it("parses owner and repo with or without .git", () => {
    expect(
      parseGithubHttpsOwnerRepo("https://github.com/CodePlatoon/aico-echo.git"),
    ).toEqual({ owner: "CodePlatoon", repo: "aico-echo" });
    expect(
      parseGithubHttpsOwnerRepo("https://github.com/CodePlatoon/aico-echo"),
    ).toEqual({ owner: "CodePlatoon", repo: "aico-echo" });
  });

  it("returns null for malformed URLs", () => {
    expect(parseGithubHttpsOwnerRepo("https://example.com/a/b")).toBeNull();
  });
});
