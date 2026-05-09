import { useState, useEffect } from 'react';
import './App.css';
import { DaySelector } from './components/DaySelector';
import { StepCard } from './components/StepCard';
import { ProgressTracker } from './components/ProgressTracker';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { useDayGuidance } from './hooks/useDayGuidance';
import type { DayGuidance } from './types';

/**
 * Main Application Component - Platoon Companion
 *
 * This is the root of the UI. It orchestrates:
 * - Day selection via structured dropdowns
 * - Loading of guidance data via the custom hook
 * - Progress tracking persisted in localStorage
 * - Rendering of the checklist and sidebar
 *
 * Architectural decisions demonstrated:
 * - Lifting state up: selectedWeek, selectedDay, and completedSteps live here
 *   and are passed down to child components (classic React pattern)
 * - Two useEffect hooks for localStorage sync (load on day change, save on progress change)
 * - Conditional rendering based on whether guidance exists for the chosen day
 *
 * This component is intentionally kept relatively simple so students can read and understand
 * the entire data flow in one file.
 *
 * Learning references:
 * - React State and useEffect: https://react.dev/learn/state-a-components-memory
 * - Persisting state with localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
 * - Lifting state up pattern: https://react.dev/learn/sharing-state-between-components
 */

const DEFAULT_WEEK = 2;
const DEFAULT_DAY = 4;
const STORAGE_KEY = 'platoon-companion-progress';

function App() {
  // === State ===
  // The currently chosen week and day. Changing these triggers guidance lookup and progress restore.
  const [selectedWeek, setSelectedWeek] = useState(DEFAULT_WEEK);
  const [selectedDay, setSelectedDay] = useState(DEFAULT_DAY);

  // Set of step IDs that the user has marked complete. Using a Set for O(1) lookup and easy toggle.
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  /**
   * Workspace path selected by the user (v0.2 feature).
   *
   * Why we add this state now:
   * - It prepares the app for the "safe command execution" part of v0.2.
   * - The shape (string | null) is intentionally simple so it can later be replaced
   *   by a real path coming from Electron's native dialog without changing any other code.
   * - This is the documented "future-proof state shape" pattern.
   */
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);

  // Derived data: the full guidance object (or undefined). The hook uses useMemo internally.
  const guidance = useDayGuidance(selectedWeek, selectedDay);

  // === Effects ===

  /**
   * Effect 1: Restore progress when the user switches to a different day.
   * Runs whenever selectedWeek or selectedDay changes.
   * If we have previously saved progress for that exact day, we hydrate the Set.
   * Otherwise we start fresh (empty Set).
   */
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}-${selectedWeek}-${selectedDay}`);
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    } else {
      setCompletedSteps(new Set());
    }
  }, [selectedWeek, selectedDay]);

  /**
   * Effect 2: Persist progress whenever the completedSteps Set changes (or day changes).
   * We only save when guidance exists to avoid writing empty state for non-existent days.
   * We convert the Set to an Array because JSON.stringify does not support Sets natively.
   */
  useEffect(() => {
    if (guidance) {
      localStorage.setItem(
        `${STORAGE_KEY}-${selectedWeek}-${selectedDay}`,
        JSON.stringify(Array.from(completedSteps))
      );
    }
  }, [completedSteps, selectedWeek, selectedDay, guidance]);

  // === Event Handlers ===

  /** Called by DaySelector when either dropdown changes. Updates both week and day atomically. */
  const handleDayChange = (week: number, day: number) => {
    setSelectedWeek(week);
    setSelectedDay(day);
  };

  /**
   * Toggles a single step's completion status.
   * We create a new Set (immutability) so React detects the change and re-renders.
   */
  const toggleComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  // === Derived UI values ===
  const currentDayLabel = guidance
    ? `Week ${guidance.week} Day ${guidance.day}`
    : 'Select a day';

  return (
    <div className="app-container">
      {/* Header with branding and current day indicator */}
      <header className="app-header">
        <div className="header-content">
          <h1>Platoon Companion</h1>
          <p className="tagline">GitHub best practices for Code Platoon AI DevOps</p>
        </div>
        <div className="current-day-badge">{currentDayLabel}</div>
      </header>

      <main className="main-content">
        {/* Day selection section - always visible */}
        <section className="selector-section">
          <h2>Choose your day</h2>
          <DaySelector
            selectedWeek={selectedWeek}
            selectedDay={selectedDay}
            onChange={handleDayChange}
          />
          <p className="hint">
            Select Week and Day to load the guided workflow for that lesson.
          </p>
        </section>

        {/* 
          Workspace folder picker (v0.2)
          We render it here so the user sets the execution context before seeing the checklist.
          This follows the documented "setup before action" UX pattern.
        */}
        <WorkspaceSelector
          workspacePath={workspacePath}
          onWorkspaceChange={setWorkspacePath}
        />

        {/* Conditional main content: either the full checklist + sidebar, or a placeholder */}
        {guidance ? (
          <>
            <div className="guidance-header">
              <h2>{guidance.title}</h2>
              <p className="summary">{guidance.summary}</p>
            </div>

            {/* 
              Safe Command Execution Preview (v0.2)
              This section demonstrates the future "Run" capability without actually executing anything.
              Why we show a preview first:
              - It is the documented safe pattern (always confirm before running commands).
              - Even when we add real execution via Electron child_process, we will keep this preview step.
              - Reference: Principle of Least Surprise in UX design.
            */}
            {workspacePath && (
              <div className="command-preview-banner">
                Workspace selected: <code>{workspacePath}</code>. 
                In the next version you will be able to preview and safely run commands here.
              </div>
            )}

            <div className="layout-grid">
              {/* Left column: the interactive checklist */}
              <div className="checklist">
                <h3>Step-by-step checklist</h3>
                {guidance.steps.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    isCompleted={completedSteps.has(step.id)}
                    onToggleComplete={toggleComplete}
                  />
                ))}
              </div>

              {/* Right column: progress + best practices (sticky on desktop) */}
              <aside className="sidebar">
                <ProgressTracker
                  steps={guidance.steps}
                  completedSteps={completedSteps}
                />

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
        ) : (
          <div className="no-guidance">
            <p>No guidance available for Week {selectedWeek} Day {selectedDay} yet.</p>
            <p>Week 2 Day 4 is fully supported. More days coming soon!</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built for Code Platoon • Always PR to your fork first • Practice makes permanent
        </p>
      </footer>
    </div>
  );
}

export default App;
