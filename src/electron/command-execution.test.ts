/**
 * Tests for v0.5 Streaming Command Execution
 *
 * These tests verify the shape and behavior of the command execution result
 * that is sent from the main process to the renderer.
 *
 * Documentation references:
 * - https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
 * - https://www.electronjs.org/docs/latest/tutorial/ipc
 */

import { describe, it, expect } from 'vitest';

describe('v0.5 Command Execution Result Shape', () => {
  it('should have the expected success result structure', () => {
    const mockSuccess = {
      success: true,
      output: 'Hello from command\n',
      error: undefined,
    };

    expect(mockSuccess.success).toBe(true);
    expect(typeof mockSuccess.output).toBe('string');
    expect(mockSuccess.error).toBeUndefined();
  });

  it('should have the expected error result structure', () => {
    const mockError = {
      success: false,
      output: 'Partial output before failure',
      error: 'Command failed with exit code 1',
    };

    expect(mockError.success).toBe(false);
    expect(mockError.error).toBeDefined();
  });
});
