import { collectRecoveryPayloads } from "./recovery-retention.ts";
export type { RetentionResult } from "../../application/project-files/recovery-maintenance.ts";
/** Keep diagnostic callers isolated while sharing the checked collector. */
export function collectRecoveryV2Pilot(...args: Parameters<typeof collectRecoveryPayloads>) {
  if (!args[0].name.startsWith("novikov-recovery-v2-pilot-"))
    throw new Error("Diagnostic database only");
  return collectRecoveryPayloads(...args);
}
