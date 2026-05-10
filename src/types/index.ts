/**
 * Type definitions for GithubBuddy daily guidance system.
 *
 * These interfaces define the shape of all data used in the app.
 * Using TypeScript interfaces provides:
 * - Compile-time type safety (catches errors before runtime)
 * - Excellent IDE autocompletion and documentation
 * - Self-documenting code for future maintainers and class presentations
 *
 * Learning references:
 * - TypeScript Interfaces: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#interfaces
 * - TypeScript Type vs Interface: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces
 * - Why we use Record<string, T> for lookup: https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type
 */

/**
 * Represents a single step in a day's workflow.
 * Each step teaches a specific GitHub or terminal action along with the professional reasoning behind it.
 */
export interface Step {
  /** Unique identifier for the step (e.g. 's1', 's2') used for progress tracking in localStorage */
  id: string;
  /** Short human-readable title shown as the card header */
  title: string;
  /** Detailed explanation of WHY this step follows GitHub best practices. This is the educational core of the app. */
  why: string;
  /** The exact terminal or gh command the student should copy/run. Shown in a code block. */
  command: string;
  /** Optional additional context or caveats (e.g. prerequisite setup) */
  notes?: string;
  /** Categorization for visual styling and future filtering (terminal, git, github, pr) */
  category: 'terminal' | 'git' | 'github' | 'pr';
}

/**
 * Complete guidance for one specific day (e.g. Week 2 Day 4).
 * Contains all steps plus a summary of GitHub best practices relevant to that day.
 */
export interface DayGuidance {
  week: number;
  day: number;
  title: string;
  summary: string;
  steps: Step[];
  bestPractices: string[];
}
