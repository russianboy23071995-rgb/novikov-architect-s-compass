import { workspacePhases, profileWorkspace } from "./workspace-load-trace";
import React from "react";
import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import "../src/styles.css";
if (!import.meta.env.DEV || location.port !== "8082")
  throw new Error("Use isolated diagnostic origin on port 8082");
// Real workspace and real browser adapters; separate origin keeps user recovery untouched.
createRoot(document.getElementById("root")!).render(
  <React.Profiler id="workspace" onRender={profileWorkspace}>
    <CadWorkspace />
  </React.Profiler>,
);

// Observation only: no model, adapter or event behavior is replaced.
const events: { at: number; label: string }[] = [];
document.addEventListener(
  "click",
  (event) => {
    const el = (event.target as Element).closest("button");
    if (el)
      events.push({
        at: performance.now(),
        label: el.getAttribute("aria-label") ?? el.textContent ?? "",
      });
  },
  true,
);
const records: { start: number; duration: number }[] = [];
const observer = new PerformanceObserver((list) => {
  records.push(
    ...list.getEntries().map((entry) => ({ start: entry.startTime, duration: entry.duration })),
  );
});
if (PerformanceObserver.supportedEntryTypes.includes("longtask"))
  observer.observe({ entryTypes: ["longtask"] });
const exportTrace = document.createElement("button");
exportTrace.textContent = "Diagnose herunterladen";
exportTrace.style.cssText =
  "position:fixed;right:12px;bottom:36px;z-index:1000;background:white;font:11px system-ui;padding:4px";
exportTrace.onclick = () => {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          { userAgent: navigator.userAgent, events, records, workspacePhases },
          null,
          2,
        ),
      ],
      {
        type: "application/json",
      },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "workspace-longtasks.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
document.body.append(exportTrace);
