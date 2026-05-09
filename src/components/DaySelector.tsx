import React from 'react';

/**
 * DaySelector Component
 *
 * Renders two native HTML <select> dropdowns allowing the user to choose
 * a week (1-12) and a day (1-5). This implements the "structured" day input
 * method chosen during planning.
 *
 * Why native <select> instead of a custom UI library?
 * - Zero additional dependencies (keeps bundle small for v1)
 * - Excellent keyboard accessibility out of the box
 * - Simple controlled component pattern that is easy to understand and teach
 *
 * Learning references:
 * - React Controlled Components: https://react.dev/learn/sharing-state-between-components#controlled-components
 * - Accessibility for <select>: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
 * - Array.from for generating option ranges: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
 */

interface DaySelectorProps {
  /** Currently selected week number (controlled by parent) */
  selectedWeek: number;
  /** Currently selected day number (controlled by parent) */
  selectedDay: number;
  /** Callback fired when either dropdown changes. Parent computes new key and loads guidance. */
  onChange: (week: number, day: number) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedWeek,
  selectedDay,
  onChange,
}) => {
  // Generate week options 1 through 12 (Code Platoon runs ~12 weeks)
  const weeks = Array.from({ length: 12 }, (_, i) => i + 1);
  // Generate day options 1 through 5 (typical lesson/lab/challenge days per week)
  const days = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="day-selector">
      {/* Week selector - uses controlled value + onChange to lift state up to App */}
      <label>
        Week
        <select
          value={selectedWeek}
          onChange={(e) => onChange(Number(e.target.value), selectedDay)}
          aria-label="Select course week"
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </label>

      {/* Day selector - same controlled pattern. Changing either triggers guidance reload */}
      <label>
        Day
        <select
          value={selectedDay}
          onChange={(e) => onChange(selectedWeek, Number(e.target.value))}
          aria-label="Select day of the week"
        >
          {days.map((d) => (
            <option key={d} value={d}>
              Day {d}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
