import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { GuidancePanel } from "./GuidancePanel";
import { getDayGuidance } from "../data/days";
import { renderWithToast } from "../test/renderWithToast";
import { WORKFLOW_TOASTS } from "../content/githubWorkflowHints";

describe("GuidancePanel", () => {
  const guidance = getDayGuidance(2, 1)!;

  beforeEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  it("renders title and checklist", () => {
    renderWithToast(
      <GuidancePanel
        progressScope="2-1"
        guidance={guidance}
        workspacePath={null}
        upstreamPath={null}
      />,
    );
    expect(
      screen.getByRole("heading", { name: guidance.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(/step-by-step checklist/i)).toBeInTheDocument();
  });

  it("shows upstream warning when placeholder remains", () => {
    renderWithToast(
      <GuidancePanel
        progressScope="2-1"
        guidance={guidance}
        workspacePath="/work"
        upstreamPath={null}
      />,
    );
    const banner = document.querySelector(".command-preview-banner");
    expect(banner?.textContent).toMatch(/\{\{UPSTREAM\}\}/);
  });

  it("Run all stops when a command fails", async () => {
    const executeCommand = vi
      .fn()
      .mockResolvedValueOnce({ success: true, output: "" })
      .mockResolvedValueOnce({ success: false, error: "git said no" });
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand,
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
      onCommandOutput: vi.fn(() => () => {}),
      onCommandComplete: vi.fn(() => () => {}),
    };
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithToast(
      <GuidancePanel
        progressScope="2-1"
        guidance={guidance}
        workspacePath="/repo"
        upstreamPath="/up"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /run all runnable steps/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/git said no/i)).toBeInTheDocument();
    });
    expect(executeCommand.mock.calls.length).toBe(2);
    expect(
      await screen.findByText(/run all stopped on the first failing step/i),
    ).toBeInTheDocument();
  });

  it("Run all catches executeCommand rejection", async () => {
    const executeCommand = vi.fn().mockRejectedValueOnce(new Error("ipc"));
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand,
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
      onCommandOutput: vi.fn(() => () => {}),
      onCommandComplete: vi.fn(() => () => {}),
    };
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithToast(
      <GuidancePanel
        progressScope="2-1"
        guidance={guidance}
        workspacePath="/repo"
        upstreamPath="/up"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /run all runnable steps/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/Stopped: ipc/i)).toBeInTheDocument();
    });
    expect(
      await screen.findByText(/run all stopped on the first failing step/i),
    ).toBeInTheDocument();
  });

  it("Run all does nothing when user cancels confirm", () => {
    const executeCommand = vi.fn();
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand,
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
      onCommandOutput: vi.fn(() => () => {}),
      onCommandComplete: vi.fn(() => () => {}),
    };
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWithToast(
      <GuidancePanel
        progressScope="2-1"
        guidance={guidance}
        workspacePath="/repo"
        upstreamPath="/up"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /run all runnable steps/i }),
    );
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it("Run all invokes executeCommand for each runnable step", async () => {
    const executeCommand = vi
      .fn()
      .mockResolvedValue({ success: true, output: "" });
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand,
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
      onCommandOutput: vi.fn(() => () => {}),
      onCommandComplete: vi.fn(() => () => {}),
    };
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithToast(
      <GuidancePanel
        progressScope="2-1"
        guidance={guidance}
        workspacePath="/repo"
        upstreamPath="/up"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /run all runnable steps/i }),
    );

    await waitFor(() => {
      expect(executeCommand.mock.calls.length).toBeGreaterThanOrEqual(6);
    });
    expect(
      await screen.findByText(WORKFLOW_TOASTS.runAllFinished),
    ).toBeInTheDocument();
  });
});
