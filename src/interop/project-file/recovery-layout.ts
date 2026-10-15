/** Shared production store names and slot addressing; no database is opened here. */
export function recoveryV2Layout(projectId: string) {
  return {
    legacy: "snapshots",
    heads: "recovery-v2-heads",
    assets: "recovery-v2-assets",
    legacyKey: `project:${projectId}`,
    index: "recovery-index",
  };
}
