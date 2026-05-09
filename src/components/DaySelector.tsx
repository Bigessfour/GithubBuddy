import React, { useEffect, useState } from 'react';
import { getAvailableWeeksAndDays, hasLocalCourseContent } from '../utils/courseScanner';

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

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedWeek,
  selectedDay,
  onChange,
}) => {
  const [availableWeeks, setAvailableWeeks] = useState<number[]>(Array.from({ length: 12 }, (_, i) => i + 1));
  const [availableDays, setAvailableDays] = useState<number[]>(Array.from({ length: 5 }, (_, i) => i + 1));
  const [usingLocalContent, setUsingLocalContent] = useState(false);

  useEffect(() => {
    // Check if the student has placed a local copy of the course repo
    if (hasLocalCourseContent()) {
      const weeksData = getAvailableWeeksAndDays();
      if (weeksData.length > 0) {
        const weeks = weeksData.map((w) => w.week);
        setAvailableWeeks(weeks);

        // Set days for the currently selected week (or first available week)
        const currentWeekData = weeksData.find((w) => w.week === selectedWeek) || weeksData[0];
        if (currentWeekData) {
          setAvailableDays(currentWeekData.days);
        }
        setUsingLocalContent(true);
      }
    }
  }, [selectedWeek]);

  // When week changes, update available days if using local content
  const handleWeekChange = (newWeek: number) => {
    if (usingLocalContent) {
      const weeksData = getAvailableWeeksAndDays();
      const weekData = weeksData.find((w) => w.week === newWeek);
      if (weekData) {
        setAvailableDays(weekData.days);
        // Pick the first available day for that week
        onChange(newWeek, weekData.days[0]);
        return;
      }
    }
    onChange(newWeek, selectedDay);
  };

  const handleDayChange = (newDay: number) => {
    onChange(selectedWeek, newDay);
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
          Using local course content from <code>data/course-content/aico-echo</code>
        </p>
      )}
    </div>
  );
};
