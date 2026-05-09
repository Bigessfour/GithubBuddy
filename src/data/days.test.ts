/**
 * Automated tests for the days data layer.
 *
 * These tests prove that:
 * 1. The getDayGuidance function correctly returns Week 2 Day 4 data
 * 2. It returns undefined for days that have not been authored yet
 * 3. The data structure matches our TypeScript interfaces (type safety)
 *
 * Why test the data layer first?
 * - It has no React dependencies (pure functions)
 * - It is the foundation everything else builds on
 * - Fast feedback loop (runs in < 100ms)
 *
 * To run: npm test
 * To run once: npx vitest run
 *
 * References:
 * - Vitest getting started: https://vitest.dev/guide/
 * - Testing library for React (future component tests): https://testing-library.com/docs/react-testing-library/intro/
 */

import { describe, it, expect } from 'vitest';
import { getDayGuidance, days } from './days';

describe('getDayGuidance', () => {
  it('should return the Week 2 Day 4 guidance when requested', () => {
    const guidance = getDayGuidance(2, 4);

    expect(guidance).toBeDefined();
    expect(guidance?.week).toBe(2);
    expect(guidance?.day).toBe(4);
    expect(guidance?.title).toContain('Week 2 - Day 4');
    // Verify we have the expected number of steps (7 in our seed data)
    expect(guidance?.steps.length).toBe(7);
  });

  it('should return undefined for a day that has not been created yet', () => {
    const guidance = getDayGuidance(99, 99);
    expect(guidance).toBeUndefined();
  });

  it('should expose all authored days via the days export', () => {
    expect(Object.keys(days)).toContain('W2D4');
  });
});
