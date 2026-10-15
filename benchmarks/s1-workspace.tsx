import React from "react";
import { workspacePhases } from "./workspace-load-trace";
import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { s1Fixture } from "./s1-fixture";
import { checkS1 } from "./s1-check";
import { image } from "./recovery-session-fixture";
import "../src/styles.css";
if (!import.meta.env.PROD || location.port !== "8085") throw Error("Isolated production test only");
const mixed = new URLSearchParams(location.search).get("variant") === "GB";
const project = s1Fixture(
  mixed ? Array.from({ length: 20 }, (_, i) => ({ ...image(100 + i), id: `s1-image-${i}` })) : [],
);
createRoot(document.getElementById("root")!).render(<CadWorkspace initialProject={project} />);
const events: unknown[] = [],
  longtasks: unknown[] = [],
  frames: number[] = [];
let last = performance.now(),
  running = true;
function frame(now: number) {
  if (!running) return;
  frames.push(now - last);
  last = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener(
  "click",
  (e) => {
    const target = (e.target as Element).closest("button");
    if (target)
      events.push({
        at: performance.now(),
        label: target.getAttribute("aria-label") ?? target.textContent,
      });
  },
  true,
);
const observer = new PerformanceObserver((list) =>
  longtasks.push(...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration }))),
);
if (PerformanceObserver.supportedEntryTypes.includes("longtask"))
  observer.observe({ entryTypes: ["longtask"] });
const panel = document.createElement("details");
panel.style.cssText =
  "position:fixed;right:12px;top:130px;z-index:1000;background:white;max-width:480px;max-height:60vh;overflow:auto;padding:8px;font:12px system-ui";
panel.innerHTML =
  '<summary>S1 Diagnose</summary><button id="s1-check">Modellvergleich ausführen</button> <button id="s1-trace">Messung abschließen</button><pre id="s1-result"></pre>';
document.body.append(panel);
const report: Record<string, unknown> = {
  variant: mixed ? "GB" : "G",
  userAgent: navigator.userAgent,
  viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
  events,
  longtasks,
  workspacePhases,
};
const show = () => {
  panel.querySelector("#s1-result")!.textContent = JSON.stringify(report, null, 2);
};
panel.querySelector("#s1-check")!.addEventListener("click", async () => {
  report["status"] = "running";
  show();
  await new Promise((r) => setTimeout(r, 50));
  try {
    report["model"] = await checkS1(project);
    report["status"] = "complete";
  } catch (e) {
    report["error"] = String(e);
    report["status"] = "failed";
  }
  show();
});
panel.querySelector("#s1-trace")!.addEventListener("click", () => {
  running = false;
  observer.disconnect();
  report["frames"] = frames;
  show();
});
