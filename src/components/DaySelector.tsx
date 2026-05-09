import { useMemo, useState } from 'react';
import { getAvailableWeeksAndDays, hasLocalCourseContent } from '../utils/courseScanner';

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

export function DaySelector({ selectedWeek, selectedDay, onChange }: DaySelectorProps) {
  const [scanVersion, setScanVersion] = useState(0);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

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
    const currentWeekData = weeksData.find((w) => w.week === selectedWeek) || weeksData[0];
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

  const handleFetchUpstream = async () => {
    if (!isElectron || !window.electronAPI) return;
    const api = window.electronAPI;
    setIsFetching(true);
    setFetchStatus('Starting fetch...');

    const customUrl = window.prompt('Enter upstream repo URL (or leave blank for default):', '');
    const urlToUse = customUrl?.trim() || undefined;

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = api.onUpstreamStatus?.((data: { message: string }) => {
        if (data.message) setFetchStatus(data.message);
      });

      const result = await api.fetchUpstreamRepo(urlToUse);

      if (result.success) {
        setScanVersion((v) => v + 1);
        setFetchStatus(result.message || 'Course content updated.');
        setIsFetching(false);
      } else {
        setFetchStatus(`Error: ${result.error ?? 'Unknown error'}`);
        setIsFetching(false);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setFetchStatus(`Failed: ${message}`);
      setIsFetching(false);
    } finally {
      unsubscribe?.();
    }
  };

  return (
    <div className="day-selector">
      <div className="selector-header">
        <label>
          Week
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

        <label>
          Day
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
          Using local course content from <code>data/course-content/aico-echo</code> — full day focus loaded
        </p>
      )}

      {isElectron && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={handleFetchUpstream}
            disabled={isFetching}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isFetching ? 'not-allowed' : 'pointer',
              opacity: isFetching ? 0.7 : 1,
            }}
          >
            {isFetching ? 'Fetching...' : 'Fetch Upstream Repo Data'}
          </button>
          {fetchStatus && (
            <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#374151' }}>
              {fetchStatus}
            </p>
          )}
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
            Clones or updates the private course repo (requires GitHub auth)
          </p>
        </div>
      )}
    </div>
  );
}
