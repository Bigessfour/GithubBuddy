import { useState, useEffect } from 'react';
import type { DayGuidance } from '../types';
import { StepCard } from './StepCard';
import { ProgressTracker } from './ProgressTracker';

const STORAGE_PREFIX = 'platoon-companion-progress';

type GuidancePanelProps = {
  /** `${week}-${day}` — changing parent `key` remounts this panel and reloads progress from localStorage. */
  progressScope: string;
  guidance: DayGuidance;
  workspacePath: string | null;
};

/**
 * Isolated checklist + progress for one (week, day). Mounted with `key={week-day}` so
 * `useState` initializer reads the correct localStorage bucket without a sync effect
 * (satisfies react-hooks/set-state-in-effect).
 */
export function GuidancePanel({ progressScope, guidance, workspacePath }: GuidancePanelProps) {
  const storageKey = `${STORAGE_PREFIX}-${progressScope}`;

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(completedSteps)));
  }, [completedSteps, storageKey]);

  const toggleComplete = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  return (
    <>
      <div className="guidance-header">
        <h2>{guidance.title}</h2>
        <p className="summary">{guidance.summary}</p>
      </div>

      {workspacePath && (
        <div className="command-preview-banner">
          Workspace selected: <code>{workspacePath}</code>. In the next version you will be able to preview and
          safely run commands here.
        </div>
      )}

      <div className="layout-grid">
        <div className="checklist">
          <h3>Step-by-step checklist</h3>
          {guidance.steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isCompleted={completedSteps.has(step.id)}
              onToggleComplete={toggleComplete}
              workspacePath={workspacePath}
            />
          ))}
        </div>

        <aside className="sidebar">
          <ProgressTracker steps={guidance.steps} completedSteps={completedSteps} />

          <div className="best-practices">
            <h3>GitHub Best Practices</h3>
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
