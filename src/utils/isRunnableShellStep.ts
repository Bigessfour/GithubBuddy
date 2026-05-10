/** Steps whose resolved command is meant to run in the shell (not editorial # comments). */
export function isRunnableShellCommand(resolvedCommand: string): boolean {
  return !resolvedCommand.trim().startsWith("#");
}
