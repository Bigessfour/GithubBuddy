import React, { useState } from "react";
import type { Step } from "../types";
import { CommandOutput } from "./CommandOutput";
import { Tooltip } from "./Tooltip";
import { useToast } from "../context/useToast";
import {
  WORKFLOW_TOASTS,
  WORKFLOW_TOOLTIPS,
} from "../content/githubWorkflowHints";
import { appLog } from "../utils/appLog";

/**
 * StepCard – v0.4 with Safe Command Execution
 *
 * This component now includes a "Run" button that appears when:
 *   1. A workspace folder has been selected, AND
 *   2. The step has a real command (not a comment starting with #)
 *
 * Execution flow:
 * 1. User clicks "Run"
 * 2. We show a browser confirm dialog with the exact command (preview)
 * 3. If user confirms, we call window.electronAPI.executeCommand(command, workspacePath)
 * 4. We display the result using the CommandOutput component
 *
 * Why we show a confirmation dialog:
 * - This is the documented "preview before action" safety pattern.
 * - It prevents accidental execution of commands.
 * - In a future version we can replace this with a beautiful custom modal.
 *
 * Security model:
 * - The actual execution happens in the main process (see electron/main.ts)
 * - The renderer only ever sends the command string and working directory.
 * - No arbitrary code execution is possible from the UI.
 *
 * References:
 * - IPC from renderer: https://www.electronjs.org/docs/latest/tutorial/ipc#renderer-to-main
 * - child_process security considerations: https://nodejs.org/api/child_process.html#security
 */

interface StepCardProps {
  step: Step;
  /** Fully resolved shell command (placeholders replaced) for display, copy, and run. */
  resolvedCommand: string;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  workspacePath: string | null;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  resolvedCommand,
  isCompleted,
  onToggleComplete,
  workspacePath,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [liveOutput, setLiveOutput] = useState("");
  const [liveError, setLiveError] = useState("");
  const [commandResult, setCommandResult] = useState<{
    output: string;
    error?: string;
    success: boolean;
    exitCode?: number | null;
  } | null>(null);

  const isComment = resolvedCommand.trim().startsWith("#");
  const canRun = workspacePath && !isComment;

  const handleCopy = async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(resolvedCommand);
      setCopied(true);
      showToast(WORKFLOW_TOASTS.copiedCommand, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      appLog("error", "StepCard", "copy command failed", {
        stepId: step.id,
        error: err instanceof Error ? err.message : String(err),
      });
      showToast(WORKFLOW_TOASTS.copyFailed, "error");
    }
  };

  /**
   * Handles the "Run" button click.
   *
   * Shows a confirmation dialog with the exact command the user is about to execute.
   * This is the safety mechanism for v0.4.
   */
  const handleRunCommand = async () => {
    if (!workspacePath || !window.electronAPI?.executeCommand) {
      showToast(
        "Command execution is only available in the desktop app.",
        "error",
      );
      return;
    }

    const confirmed = window.confirm(
      `You are about to run this command in:\n${workspacePath}\n\n` +
        `${resolvedCommand}\n\n` +
        `Do you want to continue?`,
    );

    if (!confirmed) return;

    setIsRunning(true);
    setLiveOutput("");
    setLiveError("");
    setCommandResult(null);

    // v0.5: Set up streaming listeners
    const cleanupOutput = window.electronAPI.onCommandOutput?.((chunk) => {
      if (chunk.type === "stdout") {
        setLiveOutput((prev) => prev + chunk.data);
      } else {
        setLiveError((prev) => prev + chunk.data);
      }
    });

    const cleanupComplete = window.electronAPI.onCommandComplete?.((result) => {
      appLog(
        result.success ? "info" : "warn",
        "StepCard",
        "command finished",
        {
          stepId: step.id,
          success: result.success,
          exitCode: result.exitCode,
          error: result.error,
        },
      );
      setCommandResult({
        output: result.output || "",
        error: result.error,
        success: result.success,
        exitCode: result.exitCode,
      });
      setIsRunning(false);
      cleanupOutput?.();
      cleanupComplete?.();
    });

    try {
      await window.electronAPI.executeCommand(resolvedCommand, workspacePath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      appLog("error", "StepCard", "executeCommand rejected", {
        stepId: step.id,
        message,
      });
      setCommandResult({
        output: liveOutput,
        error: message,
        success: false,
        exitCode: null,
      });
      setIsRunning(false);
      cleanupOutput?.();
      cleanupComplete?.();
    }
  };

  return (
    <div className={`step-card ${isCompleted ? "completed" : ""}`}>
      <div className="step-header">
        <label className="complete-toggle">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggleComplete(step.id)}
            aria-label={`Mark step ${step.id} as complete`}
          />
          <span className="step-number">{step.id.replace("s", "")}</span>
        </label>

        <h3>{step.title}</h3>
        <span className={`category-badge ${step.category}`}>
          {step.category}
        </span>
      </div>

      <p className="why">{step.why}</p>

      <div className="command-block">
        <pre>
          <code>{resolvedCommand}</code>
        </pre>
        <Tooltip text={WORKFLOW_TOOLTIPS.copyCommand}>
          <button
            type="button"
            className="copy-button"
            onClick={handleCopy}
            aria-label={copied ? "Command copied" : "Copy command to clipboard"}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </Tooltip>
      </div>

      {/* v0.4: Run button – only shown when workspace is selected and command is not a comment */}
      {canRun && (
        <div className="run-section">
          <Tooltip text={WORKFLOW_TOOLTIPS.runCommand} disabled={isRunning}>
            <button
              type="button"
              className="run-button"
              onClick={handleRunCommand}
              disabled={isRunning}
            >
              {isRunning ? "Running..." : "Run Command"}
            </button>
          </Tooltip>
          <span className="run-hint">
            Executes in your selected workspace folder
          </span>
        </div>
      )}

      {/* v0.5: Show live streaming output while running, or final result */}
      {isRunning && (liveOutput || liveError) && (
        <CommandOutput
          output={liveOutput}
          error={liveError}
          success={false} // still running
        />
      )}

      {commandResult && !isRunning && (
        <CommandOutput
          output={commandResult.output}
          error={commandResult.error}
          success={commandResult.success}
          exitCode={commandResult.exitCode}
        />
      )}

      {step.notes && <p className="notes">{step.notes}</p>}
    </div>
  );
};
