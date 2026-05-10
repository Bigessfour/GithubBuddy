import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { renderWithToast } from "../test/renderWithToast";

describe("WorkspaceSelector", () => {
  beforeEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  it("calls onWorkspaceChange with trimmed path from prompt in browser mode", () => {
    const onWorkspaceChange = vi.fn();
    const promptSpy = vi
      .spyOn(window, "prompt")
      .mockReturnValue("  /Users/student/my-fork  ");

    renderWithToast(
      <WorkspaceSelector
        workspacePath={null}
        onWorkspaceChange={onWorkspaceChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /choose workspace folder/i }),
    );

    expect(onWorkspaceChange).toHaveBeenCalledWith("/Users/student/my-fork");
    promptSpy.mockRestore();
  });

  it("does not change workspace when user cancels browser prompt", () => {
    const onWorkspaceChange = vi.fn();
    vi.spyOn(window, "prompt").mockReturnValue(null);
    renderWithToast(
      <WorkspaceSelector
        workspacePath={null}
        onWorkspaceChange={onWorkspaceChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /choose workspace folder/i }),
    );
    expect(onWorkspaceChange).not.toHaveBeenCalled();
  });

  it("does not change workspace when Electron dialog is cancelled", async () => {
    const onWorkspaceChange = vi.fn();
    window.electronAPI = {
      selectWorkspace: vi.fn().mockResolvedValue(null),
      selectUpstreamFolder: vi.fn().mockResolvedValue(null),
      executeCommand: vi.fn().mockResolvedValue({ success: true, output: "" }),
      getCourseContentScan: vi
        .fn()
        .mockReturnValue({ hasLocal: false, weeks: [] }),
      getDayFocusContent: vi.fn().mockReturnValue(null),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({ success: true }),
    };
    renderWithToast(
      <WorkspaceSelector
        workspacePath={null}
        onWorkspaceChange={onWorkspaceChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /choose workspace folder/i }),
    );
    await vi.waitFor(() =>
      expect(window.electronAPI?.selectWorkspace).toHaveBeenCalled(),
    );
    expect(onWorkspaceChange).not.toHaveBeenCalled();
  });

  it("clears workspace when Clear is clicked", () => {
    const onWorkspaceChange = vi.fn();
    renderWithToast(
      <WorkspaceSelector
        workspacePath="/existing"
        onWorkspaceChange={onWorkspaceChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onWorkspaceChange).toHaveBeenCalledWith(null);
  });

  it("calls electron selectWorkspace when available", async () => {
    const onWorkspaceChange = vi.fn();
    window.electronAPI = {
      selectWorkspace: vi.fn().mockResolvedValue("/electron/pick"),
      selectUpstreamFolder: vi.fn().mockResolvedValue(null),
      executeCommand: vi.fn().mockResolvedValue({ success: true, output: "" }),
      getCourseContentScan: vi
        .fn()
        .mockReturnValue({ hasLocal: false, weeks: [] }),
      getDayFocusContent: vi.fn().mockReturnValue(null),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({ success: true }),
    };

    renderWithToast(
      <WorkspaceSelector
        workspacePath={null}
        onWorkspaceChange={onWorkspaceChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /choose workspace folder/i }),
    );

    await vi.waitFor(() => {
      expect(onWorkspaceChange).toHaveBeenCalledWith("/electron/pick");
    });
  });
});
