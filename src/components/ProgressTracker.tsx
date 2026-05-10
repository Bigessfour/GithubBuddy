import React from "react";
import type { Step } from "../types";
import { Tooltip } from "./Tooltip";
import { WORKFLOW_TOOLTIPS } from "../content/githubWorkflowHints";

/**
 * ProgressTracker Component
 *
 * Shows a visual progress bar and completion count for the currently loaded day.
 * Receives the full steps array and the Set of completed step IDs from parent state.
 *
 * This component is purely presentational (no side effects) which makes it easy to test.
 * The percentage is calculated client-side so it updates instantly as the user checks boxes.
 *
 * Learning concepts:
 * - Deriving UI state from props (no internal state needed)
 * - Simple math for progress percentage
 * - CSS-driven progress bar animation (width transition)
 *
 * References:
 * - React props and component composition: https://react.dev/learn/your-first-component
 * - CSS transitions for progress bars: https://developer.mozilla.org/en-US/docs/Web/CSS/transition
 */

interface ProgressTrackerProps {
  steps: Step[];
  completedSteps: Set<string>;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  completedSteps,
}) => {
  const completedCount = completedSteps.size;
  const total = steps.length;
  // Avoid division by zero; default to 0% when no steps exist
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h3 className="progress-title-row">
          Progress
          <Tooltip text={WORKFLOW_TOOLTIPS.progress}>
            <button
              type="button"
              className="workflow-help-btn"
              aria-label="Help: progress and checklist habits"
            >
              ?
            </button>
          </Tooltip>
        </h3>
        <span className="progress-percent">{percent}%</span>
      </div>

      {/* The actual progress bar uses inline style for dynamic width + CSS transition */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <p className="progress-text">
        {completedCount} of {total} steps completed
      </p>
    </div>
  );
};
