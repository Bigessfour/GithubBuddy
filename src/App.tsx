import { useState, useEffect } from "react";
import "./App.css";
import { DaySelector } from "./components/DaySelector";
import { WorkspaceSelector } from "./components/WorkspaceSelector";
import { UpstreamPathSelector } from "./components/UpstreamPathSelector";
import { DayFocus } from "./components/DayFocus";
import { GuidancePanel } from "./components/GuidancePanel";
import { useDayGuidance } from "./hooks/useDayGuidance";
import { useDayFocus } from "./hooks/useDayFocus";
import { STORAGE_UPSTREAM, STORAGE_WORKSPACE } from "./constants/storage";
import { readStoredPath } from "./utils/readStoredPath";
import { ToastProvider } from "./context/ToastProvider";
import { appLog } from "./utils/appLog";

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
 * - Progress for the checklist is scoped per day via `GuidancePanel` + `key={week-day}` (no sync setState in effects)
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

function AppContent() {
  useEffect(() => {
    appLog("info", "App", "App component mounted");
  }, []);

  // === State ===
  // The currently chosen week and day. Changing these triggers guidance lookup and progress restore.
  const [selectedWeek, setSelectedWeek] = useState(DEFAULT_WEEK);
  const [selectedDay, setSelectedDay] = useState(DEFAULT_DAY);

  /** Fork / project folder — command cwd; persisted across sessions. */
  const [workspacePath, setWorkspacePath] = useState<string | null>(() =>
    readStoredPath(STORAGE_WORKSPACE),
  );

  /** Local course clone root — substituted into {{UPSTREAM}} in commands. */
  const [upstreamPath, setUpstreamPath] = useState<string | null>(() =>
    readStoredPath(STORAGE_UPSTREAM),
  );

  useEffect(() => {
    try {
      if (workspacePath) {
        localStorage.setItem(STORAGE_WORKSPACE, workspacePath);
      } else {
        localStorage.removeItem(STORAGE_WORKSPACE);
      }
    } catch (e) {
      appLog("warn", "App", "localStorage workspace persist failed", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [workspacePath]);

  useEffect(() => {
    try {
      if (upstreamPath) {
        localStorage.setItem(STORAGE_UPSTREAM, upstreamPath);
      } else {
        localStorage.removeItem(STORAGE_UPSTREAM);
      }
    } catch (e) {
      appLog("warn", "App", "localStorage upstream persist failed", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [upstreamPath]);

  // Derived data: the full guidance object (or undefined). The hook uses useMemo internally.
  const guidance = useDayGuidance(selectedWeek, selectedDay);

  // v0.6: Dynamic full content from local upstream repo clone
  const dayFocus = useDayFocus(selectedWeek, selectedDay);

  /** Called by DaySelector when either dropdown changes. Updates both week and day atomically. */
  const handleDayChange = (week: number, day: number) => {
    setSelectedWeek(week);
    setSelectedDay(day);
  };

  // === Derived UI values ===
  // Always mirror the dropdowns; guidance may be missing for some week/day pairs.
  const currentDayLabel = `Week ${selectedWeek} Day ${selectedDay}`;

  return (
    <div className="app-container">
      {/* Header with branding and current day indicator */}
      <header className="app-header">
        <div className="header-content">
          <h1>Platoon Companion</h1>
          <p className="tagline">
            GitHub best practices for Code Platoon AI DevOps
          </p>
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

        <UpstreamPathSelector
          key={upstreamPath ?? "__upstream_unset__"}
          upstreamPath={upstreamPath}
          onUpstreamChange={setUpstreamPath}
        />

        {/* v0.6: Dynamic Day Focus from upstream repo (full content) */}
        {dayFocus ? (
          <DayFocus focus={dayFocus} />
        ) : guidance ? (
          <GuidancePanel
            key={`${selectedWeek}-${selectedDay}`}
            progressScope={`${selectedWeek}-${selectedDay}`}
            guidance={guidance}
            workspacePath={workspacePath}
            upstreamPath={upstreamPath}
          />
        ) : (
          <div className="no-guidance">
            <p>
              No guidance available for Week {selectedWeek} Day {selectedDay}{" "}
              yet.
            </p>
            <p>
              To load the actual lesson, lab, and challenge content from the
              upstream repo, clone it into{" "}
              <code>data/course-content/aico-echo</code>.
            </p>
            <p>See the README for setup instructions.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built for Code Platoon • Always PR to your fork first • Practice makes
          permanent
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
