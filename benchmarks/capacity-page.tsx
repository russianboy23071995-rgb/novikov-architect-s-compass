import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import type { Project } from "../src/lib/bim/model";
import { runCapacity, tick, heap } from "./capacity";
import "../src/styles.css";
if (!import.meta.env.DEV) throw new Error("Development diagnostics only");
export function Page() {
  const [status, setStatus] = useState("Ready"),
    [report, setReport] = useState(""),
    [project, setProject] = useState<Project>();
  async function run() {
    try {
      setStatus("Running");
      const result = await runCapacity(setStatus);
      const start = performance.now();
      flushSync(() => setProject(result.project));
      await tick();
      const mount2dMs = performance.now() - start;
      const switchView = async (name: string) => {
        const button = Array.from(document.querySelectorAll("main button")).find(
          (b) => b.textContent === name,
        ) as HTMLButtonElement | undefined;
        if (!button) throw new Error(`Missing ${name}`);
        const t = performance.now();
        button.click();
        await tick();
        return performance.now() - t;
      };
      const switch3dMs = await switchView("3D"),
        switch2dMs = await switchView("2D");
      setReport(
        JSON.stringify(
          {
            ...result.report,
            display: {
              mount2dMs,
              switch3dMs,
              switch2dMs,
              scope: "two RAF paint opportunity, not GPU presentation or steady navigation",
              heap: heap(),
            },
          },
          null,
          2,
        ),
      );
      setStatus("Complete");
    } catch (e) {
      setStatus(String(e));
    }
  }
  return (
    <>
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          zIndex: 99999,
          background: "white",
          padding: 8,
          width: 400,
        }}
      >
        <button disabled={status !== "Ready" && status !== "Complete"} onClick={run}>
          Run capacity baseline
        </button>
        <p role="status">{status}</p>
        <textarea
          aria-label="Capacity report"
          readOnly
          value={report}
          style={{ width: "100%", height: 130 }}
        />
      </aside>
      {project && <CadWorkspace initialProject={project} />}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Page />);
