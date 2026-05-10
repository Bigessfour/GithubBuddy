import type { Step } from "../types";

/**
 * Context for resolving `{{PLACEHOLDER}}` segments in step commands.
 * Workspace is the shell cwd (not substituted into templates by default).
 */
export type CommandInterpolationContext = {
  /** Absolute path to the local clone of the course/upstream repo (e.g. aico-echo). */
  upstreamPath: string | null;
};

const MAX_SUBSTITUTED_LEN = 50_000;

/**
 * Replaces template placeholders in a step command for display, copy, and run.
 *
 * Placeholders:
 * - {{WEEK}}, {{DAY}} — numbers from the current day guidance
 * - {{BRANCH}} — Code Platoon challenge branch: w{week}d{day}-challenges (e.g. w2d4-challenges)
 * - {{UPSTREAM}} — local course repo path; if unset, leaves {{UPSTREAM}} literal so the student fixes settings
 */
export function buildStepCommand(
  step: Step,
  week: number,
  day: number,
  ctx: CommandInterpolationContext,
): string {
  const branch = `w${week}d${day}-challenges`;
  let cmd = step.command;

  cmd = cmd.replaceAll("{{WEEK}}", String(week));
  cmd = cmd.replaceAll("{{DAY}}", String(day));
  cmd = cmd.replaceAll("{{BRANCH}}", branch);

  if (ctx.upstreamPath && ctx.upstreamPath.trim()) {
    cmd = cmd.replaceAll("{{UPSTREAM}}", ctx.upstreamPath.trim());
  }

  if (cmd.length > MAX_SUBSTITUTED_LEN) {
    return cmd.slice(0, MAX_SUBSTITUTED_LEN) + "\n… [truncated]";
  }

  return cmd;
}

export function hasUnresolvedUpstreamPlaceholder(command: string): boolean {
  return command.includes("{{UPSTREAM}}");
}
