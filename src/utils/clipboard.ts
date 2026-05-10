/**
 * Clipboard utility
 *
 * Provides a reusable, promise-based wrapper around the Clipboard API.
 * Returns a boolean indicating success so callers can show toast / feedback.
 *
 * Why wrap navigator.clipboard?
 * - Central place to handle errors and future enhancements (e.g. fallback for older browsers)
 * - Easy to mock in tests (we can spy on this function instead of the global)
 * - Keeps component code cleaner
 *
 * Note: In the current StepCard implementation we call navigator.clipboard directly
 * for simplicity. This utility is provided for future refactoring or other copy needs.
 *
 * References:
 * - MDN Clipboard.writeText: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
 * - Handling clipboard permissions: https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API
 */

import { appLog } from "./appLog";

/**
 * Copies the given text to the system clipboard.
 * @param text - The string to copy (usually a terminal command)
 * @returns Promise resolving to true on success, false on failure
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    appLog("error", "clipboard", "writeText failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
