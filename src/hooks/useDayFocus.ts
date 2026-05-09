import { useMemo } from 'react';
import { loadDayFocus, type DayFocusContent } from '../utils/courseContentLoader';

/**
 * Custom Hook: useDayFocus (v0.6)
 *
 * Loads the full content of the selected day's lesson, lab, and challenge
 * from the local upstream repo clone (when available).
 *
 * Returns null in browser mode or when no local content exists.
 */
export function useDayFocus(week: number, day: number): DayFocusContent | null {
  return useMemo(() => loadDayFocus(week, day), [week, day]);
}
