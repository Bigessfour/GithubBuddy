import { useMemo, useState } from "react";
import {
  getAvailableWeeksAndDays,
  hasLocalCourseContent,
} from "../utils/courseScanner";
import {
  DEFAULT_UPSTREAM_REPO,
  resolveValidatedUpstreamUrl,
} from "../utils/upstreamRepoUrl";
import { Tooltip } from "./Tooltip";
import { useToast } from "../context/useToast";
import {
  GITHUB_DOC_URLS,
  WORKFLOW_TOASTS,
  WORKFLOW_TOOLTIPS,
} from "../content/githubWorkflowHints";
import { appLog } from "../utils/appLog";
import type { FetchUpstreamErrorCode } from "../types/fetchUpstream";

const DEFAULT_WEEKS = Array.from({ length: 12 }, (_, i) => i + 1);
const DEFAULT_DAYS = Array.from({ length: 5 }, (_, i) => i + 1);

/**
 * DaySelector Component (Dynamic Version)
 *
 * Renders Week and Day dropdowns.
 *
 * Behavior:
 * - If the user has cloned the course repo into `data/course-content/aico-echo`,
 *   the dropdowns are populated from the actual folder structure (dynamic).
 * - If no local course content is found, it falls back to the default 12 weeks / 5 days.
 *
 * This implements the requirement that the selector can discover weeks/days from the
 * local read-only copy of the course repository.
 *
 * Educational notes are included so students understand why we scan the filesystem
 * and how it keeps the app in sync with the actual course materials.
 */

interface DaySelectorProps {
  selectedWeek: number;
  selectedDay: number;
  onChange: (week: number, day: number) => void;
}

export function DaySelector({
  selectedWeek,
  selectedDay,
  onChange,
}: DaySelectorProps) {
  const { showToast } = useToast();
  const [scanVersion, setScanVersion] = useState(0);
  const [fetchStatus, setFetchStatus] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchUpstreamUrlDraft, setFetchUpstreamUrlDraft] = useState("");
  /** null = indeterminate bar while fetching; 0–100 = git-reported progress */
  const [fetchProgressPercent, setFetchProgressPercent] = useState<
    number | null
  >(null);

  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  const { availableWeeks, availableDays, usingLocalContent } = useMemo(() => {
    // scanVersion bumps after "Fetch upstream" so we re-scan disk without effect setState.
    void scanVersion;
    if (!hasLocalCourseContent()) {
      return {
        usingLocalContent: false,
        availableWeeks: DEFAULT_WEEKS,
        availableDays: DEFAULT_DAYS,
      };
    }
    const weeksData = getAvailableWeeksAndDays();
    if (weeksData.length === 0) {
      return {
        usingLocalContent: false,
        availableWeeks: DEFAULT_WEEKS,
        availableDays: DEFAULT_DAYS,
      };
    }
    const weeks = weeksData.map((w) => w.week);
    const currentWeekData =
      weeksData.find((w) => w.week === selectedWeek) || weeksData[0];
    return {
      usingLocalContent: true,
      availableWeeks: weeks,
      availableDays: currentWeekData ? currentWeekData.days : DEFAULT_DAYS,
    };
  }, [selectedWeek, scanVersion]);

  const handleWeekChange = (newWeek: number) => {
    if (usingLocalContent) {
      const weeksData = getAvailableWeeksAndDays();
      const weekData = weeksData.find((w) => w.week === newWeek);
      if (weekData) {
        onChange(newWeek, weekData.days[0]);
        return;
      }
    }
    onChange(newWeek, selectedDay);
  };

  const handleDayChange = (newDay: number) => {
    onChange(selectedWeek, newDay);
  };

  const toastForFetchFailure = (
    code: FetchUpstreamErrorCode | undefined,
    detail: string,
  ): string => {
    if (code === "GH_CLI_MISSING") return WORKFLOW_TOASTS.fetchUpstreamGhMissing;
    if (code === "GH_AUTH_FAILED")
      return WORKFLOW_TOASTS.fetchUpstreamGhAuthFailed;
    if (code === "NO_REPO_ACCESS")
      return WORKFLOW_TOASTS.fetchUpstreamNoRepoAccess;
    return detail;
  };

  const handleFetchUpstream = async () => {
    if (!isElectron) return;
    const api = window.electronAPI!;
    setIsFetching(true);
    setFetchStatus("Starting fetch...");
    setFetchProgressPercent(null);

    const trimmed = fetchUpstreamUrlDraft.trim();
    const validated = resolveValidatedUpstreamUrl(
      trimmed === "" ? null : trimmed,
    );
    if (!validated.ok) {
      appLog("warn", "DaySelector", "fetch upstream URL validation failed", {
        error: validated.error,
      });
      setFetchStatus(`Error: ${validated.error}`);
      setIsFetching(false);
      setFetchProgressPercent(null);
      showToast(validated.error, "error");
      return;
    }

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = api.onUpstreamStatus?.(
        (data: { message: string; percent?: number }) => {
          if (data.message) setFetchStatus(data.message);
          if (typeof data.percent === "number") {
            const p = Math.min(100, Math.max(0, data.percent));
            setFetchProgressPercent(p);
          }
        },
      );

      const result = await api.fetchUpstreamRepo(validated.url);

      if (result.success) {
        appLog("info", "DaySelector", "fetch upstream completed", {
          message: result.message,
        });
        setScanVersion((v) => v + 1);
        setFetchStatus(result.message || "Course content updated.");
        setIsFetching(false);
        setFetchProgressPercent(null);
        showToast(WORKFLOW_TOASTS.fetchUpstreamSuccess, "success");
      } else {
        appLog("warn", "DaySelector", "fetch upstream failed", {
          error: result.error,
          code: result.code,
        });
        setFetchStatus(`Error: ${result.error ?? "Unknown error"}`);
        setIsFetching(false);
        setFetchProgressPercent(null);
        showToast(
          toastForFetchFailure(
            result.code,
            result.error ?? "Could not update course content.",
          ),
          "error",
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      appLog("error", "DaySelector", "fetch upstream threw", { message });
      setFetchStatus(`Failed: ${message}`);
      setIsFetching(false);
      setFetchProgressPercent(null);
      showToast(message, "error");
    } finally {
      unsubscribe?.();
    }
  };

  return (
    <div className="day-selector">
      <div className="selector-header">
        <label className="selector-field">
          <span className="selector-label-row">
            Week
            <Tooltip text={WORKFLOW_TOOLTIPS.weekSelect}>
              <button
                type="button"
                className="workflow-help-btn"
                aria-label="Help: course week and Git branches"
              >
                ?
              </button>
            </Tooltip>
          </span>
          <select
            value={selectedWeek}
            onChange={(e) => handleWeekChange(Number(e.target.value))}
            aria-label="Select course week"
          >
            {availableWeeks.map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </label>

        <label className="selector-field">
          <span className="selector-label-row">
            Day
            <Tooltip text={WORKFLOW_TOOLTIPS.daySelect}>
              <button
                type="button"
                className="workflow-help-btn"
                aria-label="Help: lesson day"
              >
                ?
              </button>
            </Tooltip>
          </span>
          <select
            value={selectedDay}
            onChange={(e) => handleDayChange(Number(e.target.value))}
            aria-label="Select day of the week"
          >
            {availableDays.map((d) => (
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {usingLocalContent && (
        <p className="local-content-notice">
          Using local course content from{" "}
          <code>data/course-content/aico-echo</code> — full day focus loaded
        </p>
      )}

      {isElectron && (
        <div className="fetch-upstream-block">
          <div className="fetch-upstream-url-field">
            <span className="selector-label-row fetch-upstream-label-row">
              <span>Course repo URL (GitHub)</span>
              <Tooltip text={WORKFLOW_TOOLTIPS.fetchUpstreamUrlHelp}>
                <button
                  type="button"
                  className="workflow-help-btn"
                  aria-label="Help: what URL to enter for Fetch upstream"
                >
                  ?
                </button>
              </Tooltip>
            </span>
            <div className="fetch-upstream-url-row">
              <Tooltip
                text={WORKFLOW_TOOLTIPS.fetchUpstreamRepoUrl}
                disabled={isFetching}
              >
                <input
                  type="text"
                  className="fetch-upstream-url-input"
                  value={fetchUpstreamUrlDraft}
                  onChange={(e) => setFetchUpstreamUrlDraft(e.target.value)}
                  placeholder={`Leave blank for default: ${DEFAULT_UPSTREAM_REPO}`}
                  aria-label="GitHub URL for course upstream (optional)"
                  disabled={isFetching}
                  autoComplete="off"
                  spellCheck={false}
                />
              </Tooltip>
              <Tooltip text={WORKFLOW_TOOLTIPS.fetchUpstream} disabled={isFetching}>
                <button
                  type="button"
                  className="fetch-upstream-button"
                  onClick={() => void handleFetchUpstream()}
                  disabled={isFetching}
                >
                  {isFetching ? "Fetching..." : "Fetch Upstream Repo Data"}
                </button>
              </Tooltip>
            </div>
          </div>
          {isFetching && (
            <div className="fetch-progress-block">
              <div className="fetch-progress-row">
                <progress
                  className="fetch-progress-bar"
                  max={100}
                  value={
                    fetchProgressPercent === null
                      ? undefined
                      : fetchProgressPercent
                  }
                  aria-label="Upstream repository download progress"
                />
                {fetchProgressPercent !== null && (
                  <span className="fetch-progress-label" aria-hidden>
                    {Math.round(fetchProgressPercent)}%
                  </span>
                )}
              </div>
              <p className="fetch-progress-hint">
                {fetchProgressPercent === null
                  ? "Connecting to Git — the bar fills when git reports transfer progress."
                  : "Progress from git stderr (may pause during resolving deltas)."}
              </p>
            </div>
          )}
          {fetchStatus && <p className="fetch-status-line">{fetchStatus}</p>}
          <p className="fetch-hint-line">
            Clones or updates the course repo (GitHub auth). See also:{" "}
            <a
              href={GITHUB_DOC_URLS.syncFork}
              target="_blank"
              rel="noreferrer"
              className="inline-doc-link"
            >
              Syncing a fork
            </a>
            {" · "}
            <a
              href={GITHUB_DOC_URLS.cloneRepo}
              target="_blank"
              rel="noreferrer"
              className="inline-doc-link"
            >
              Cloning a repository
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
