import { useState, useEffect, useMemo, useCallback } from "react";
import type { DayGuidance } from "../types";
import { StepCard } from "./StepCard";
import { ProgressTracker } from "./ProgressTracker";
import { Tooltip } from "./Tooltip";
import {
  buildStepCommand,
  hasUnresolvedUpstreamPlaceholder,
} from "../utils/commandInterpolation";
import { isRunnableShellCommand } from "../utils/isRunnableShellStep";
import { useToast } from "../context/useToast";
import {
  GITHUB_DOC_URLS,
  WORKFLOW_TOASTS,
  WORKFLOW_TOOLTIPS,
} from "../content/githubWorkflowHints";
import { formatCommandErrorHelpForLog } from "../utils/shellCommandErrorHelp";

const STORAGE_PREFIX = "platoon-companion-progress";

type GuidancePanelProps = {
  /** `${week}-${day}` — changing parent `key` remounts this panel and reloads progress from localStorage. */
  progressScope: string;
  guidance: DayGuidance;
  workspacePath: string | null;
  upstreamPath: string | null;
};

/**
 * Isolated checklist + progress for one (week, day). Mounted with `key={week-day}` so
 * `useState` initializer reads the correct localStorage bucket without a sync effect
 * (satisfies react-hooks/set-state-in-effect).
 */
export function GuidancePanel({
  progressScope,
  guidance,
  workspacePath,
  upstreamPath,
}: GuidancePanelProps) {
  const { showToast } = useToast();
  const storageKey = `${STORAGE_PREFIX}-${progressScope}`;

  const cmdCtx = useMemo(() => ({ upstreamPath }), [upstreamPath]);

  const resolvedSteps = useMemo(
    () =>
      guidance.steps.map((step) => ({
        step,
        resolvedCommand: buildStepCommand(
          step,
          guidance.week,
          guidance.day,
          cmdCtx,
        ),
      })),
    [guidance.steps, guidance.week, guidance.day, cmdCtx],
  );

  const anyUnresolvedUpstream = useMemo(
    () =>
      resolvedSteps.some((r) =>
        hasUnresolvedUpstreamPlaceholder(r.resolvedCommand),
      ),
    [resolvedSteps],
  );

  const runnableSteps = useMemo(
    () =>
      resolvedSteps.filter((r) => isRunnableShellCommand(r.resolvedCommand)),
    [resolvedSteps],
  );

  const [batchRunning, setBatchRunning] = useState(false);
  const [batchLog, setBatchLog] = useState("");

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify(Array.from(completedSteps)),
    );
  }, [completedSteps, storageKey]);

  const toggleComplete = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const handleRunAll = useCallback(async () => {
    const api = window.electronAPI;
    if (!workspacePath || !api?.executeCommand) {
      showToast(
        "Run all requires the desktop app and a selected workspace folder.",
        "error",
      );
      return;
    }
    if (runnableSteps.length === 0) {
      showToast("No runnable shell steps on this day.", "error");
      return;
    }

    const lines = runnableSteps.map(
      (r, i) => `${i + 1}. [${r.step.title}] ${r.resolvedCommand}`,
    );
    const upstreamNote = anyUnresolvedUpstream
      ? "\n\nWarning: some commands still contain {{UPSTREAM}}. Fix the course folder first.\n"
      : "";
    const ok = window.confirm(
      `Run ${runnableSteps.length} commands in order and stop on the first failure?${upstreamNote}\n\n${lines.join("\n")}`,
    );
    if (!ok) return;

    setBatchRunning(true);
    setBatchLog("");

    let stoppedEarly = false;

    for (const { step, resolvedCommand } of runnableSteps) {
      setBatchLog((prev) => `${prev}\n\n--- ${step.id}: ${step.title} ---\n`);

      const unsubOut = api.onCommandOutput?.((chunk) => {
        setBatchLog((prev) => prev + chunk.data);
      });

      try {
        const result = await api.executeCommand(resolvedCommand, workspacePath);
        unsubOut?.();
        if (!result.success) {
          stoppedEarly = true;
          const help = formatCommandErrorHelpForLog(
            result.error,
            result.exitCode,
          );
          setBatchLog(
            (prev) =>
              `${prev}\nStopped: command failed.${result.error ? `\n${result.error}` : ""}${help}`,
          );
          break;
        }
        setBatchLog((prev) => `${prev}\n— step finished successfully —\n`);
      } catch (e: unknown) {
        unsubOut?.();
        stoppedEarly = true;
        const message = e instanceof Error ? e.message : String(e);
        setBatchLog((prev) => `${prev}\nStopped: ${message}\n`);
        break;
      }
    }

    setBatchRunning(false);
    if (stoppedEarly) {
      showToast(
        "Run all stopped on the first failing step. Fix the error, then re-run or run steps individually.",
        "error",
      );
    } else {
      showToast(WORKFLOW_TOASTS.runAllFinished, "success");
    }
  }, [workspacePath, runnableSteps, anyUnresolvedUpstream, showToast]);

  return (
    <>
      <div className="guidance-header">
        <h2>{guidance.title}</h2>
        <p className="summary">{guidance.summary}</p>
      </div>

      {workspacePath && (
        <div className="command-preview-banner">
          Commands run in: <code>{workspacePath}</code>
          {upstreamPath && (
            <>
              {" "}
              · Upstream template: <code>{upstreamPath}</code>
            </>
          )}
          {anyUnresolvedUpstream && (
            <span className="upstream-warning">
              {" "}
              · Some steps still contain {"{{UPSTREAM}}"} — set and save the
              course folder above.
            </span>
          )}
        </div>
      )}

      <div className="layout-grid">
        <div className="checklist">
          <div className="checklist-header-row">
            <h3>Step-by-step checklist</h3>
            {workspacePath && runnableSteps.length > 0 && (
              <Tooltip text={WORKFLOW_TOOLTIPS.runAll} disabled={batchRunning}>
                <button
                  type="button"
                  className="run-all-button"
                  disabled={batchRunning}
                  onClick={() => void handleRunAll()}
                >
                  {batchRunning ? "Running all…" : "Run all runnable steps"}
                </button>
              </Tooltip>
            )}
          </div>
          {batchLog && (
            <pre className="batch-run-log" aria-live="polite">
              {batchLog}
            </pre>
          )}
          {resolvedSteps.map(({ step, resolvedCommand }) => (
            <StepCard
              key={step.id}
              step={step}
              resolvedCommand={resolvedCommand}
              isCompleted={completedSteps.has(step.id)}
              onToggleComplete={toggleComplete}
              workspacePath={workspacePath}
            />
          ))}
        </div>

        <aside className="sidebar">
          <ProgressTracker
            steps={guidance.steps}
            completedSteps={completedSteps}
          />

          <div className="best-practices">
            <div className="best-practices-header">
              <h3>GitHub Best Practices</h3>
              <Tooltip text={WORKFLOW_TOOLTIPS.bestPracticesAside}>
                <button
                  type="button"
                  className="workflow-help-btn"
                  aria-label="Help: how these reminders relate to GitHub flow"
                >
                  ?
                </button>
              </Tooltip>
            </div>
            <p className="best-practices-doc-links">
              <a
                href={GITHUB_DOC_URLS.forkRepo}
                target="_blank"
                rel="noreferrer"
                className="inline-doc-link"
              >
                Fork a repo
              </a>
              {" · "}
              <a
                href={GITHUB_DOC_URLS.createPrFromFork}
                target="_blank"
                rel="noreferrer"
                className="inline-doc-link"
              >
                Pull requests from a fork
              </a>
            </p>
            <ul>
              {guidance.bestPractices.map((practice, index) => (
                <li key={index}>{practice}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
