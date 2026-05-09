import { useMemo } from 'react';
import { getDayGuidance } from '../data/days';
import type { DayGuidance } from '../types';

/**
 * Custom React Hook: useDayGuidance
 *
 * Encapsulates the logic of looking up guidance data for a given week/day.
 * Returns the full DayGuidance object (or undefined if not yet authored).
 *
 * Why a custom hook?
 * - Keeps the lookup logic in one place (DRY)
 * - Uses useMemo to avoid unnecessary re-computations when week/day haven't changed
 * - Makes the hook easily testable in isolation (see tests below)
 * - Hides the internal "W{week}D{day}" key format from the rest of the app
 *
 * Learning references:
 * - React custom hooks: https://react.dev/learn/reusing-logic-with-custom-hooks
 * - useMemo for derived state: https://react.dev/reference/react/useMemo
 * - Separation of concerns in React apps
 */
export function useDayGuidance(week: number, day: number): DayGuidance | undefined {
  // useMemo ensures we only call getDayGuidance when the inputs actually change.
  // This is a micro-optimization that also makes the hook's dependencies explicit.
  return useMemo(() => getDayGuidance(week, day), [week, day]);
}
