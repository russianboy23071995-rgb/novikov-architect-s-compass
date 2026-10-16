import React from "react";
import { imageResourcePilotStats } from "./image-resource-pilot";
import { compareImageSwitches } from "./image-switch-comparison";
import { workspacePhases } from "./workspace-load-trace";
import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { s1Fixture } from "./s1-fixture";
import { checkS1 } from "./s1-check";
import { image } from "./recovery-session-fixture";
import "../src/styles.css";
if (!import.meta.env.PROD || location.port !== "8085") throw Error("Isolated production test only");
// Diagnostic only: isolate synchronous browser cost of assigning SVG image URLs.
// No source payload is recorded and the native call/arguments remain unchanged.
const nativeSetAttribute = Element.prototype.setAttribute;
// Counterfactual confined to this disposable fixture page. Never a product cache:
// intentionally retained for the run, all URLs revoked when leaving this page.
const shortImageUrls = new URLSearchParams(location.search).get("imageUrls") === "blob";
if (shortImageUrls && new URLSearchParams(location.search).get("imageResources") === "bounded")
  throw Error("Do not combine the bounded pilot with the old blob counterfactual");
const hideImages = new URLSearchParams(location.search).get("imagePaint") === "hidden";
if (hideImages) {
  const style = document.createElement("style");
  style.textContent = "svg image { display: none !important; }";
  document.head.append(style);
}
const diagnosticUrls = new Map<string, string>();
addEventListener("pagehide", () => {
  for (const url of diagnosticUrls.values()) URL.revokeObjectURL(url);
  diagnosticUrls.clear();
});
Element.prototype.setAttribute = function (name: string, value: string) {
  if (
    this.namespaceURI !== "http://www.w3.org/2000/svg" ||
    this.localName !== "image" ||
    name !== "href"
  )
    return nativeSetAttribute.call(this, name, value);
  if (shortImageUrls && value.startsWith("data:image/")) {
    let url = diagnosticUrls.get(value);
    if (!url) {
      const conversionStart = performance.now();
      const comma = value.indexOf(",");
      const binary = atob(value.slice(comma + 1));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      url = URL.createObjectURL(new Blob([bytes], { type: value.slice(5, value.indexOf(";")) }));
      diagnosticUrls.set(value, url);
      workspacePhases.push({
        kind: "browser-dom",
        event: "diagnostic-blob-create",
        start: conversionStart,
        duration: performance.now() - conversionStart,
      });
    }
    value = url;
  }
  const start = performance.now();
  try {
    return nativeSetAttribute.call(this, name, value);
  } finally {
    workspacePhases.push({
      kind: "browser-dom",
      event: "svg-image-href",
      start,
      duration: performance.now() - start,
      characters: value.length,
    });
  }
};
const mixed = new URLSearchParams(location.search).get("variant") === "GB";
const project = s1Fixture(
  mixed ? Array.from({ length: 20 }, (_, i) => ({ ...image(100 + i), id: `s1-image-${i}` })) : [],
);
createRoot(document.getElementById("root")!).render(<CadWorkspace initialProject={project} />);
const events: unknown[] = [],
  longAnimationFrames: unknown[] = [],
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
for (const eventType of ["click", "dblclick"])
  document.addEventListener(
    eventType,
    (e) => {
      if (!running) return;
      const target = (e.target as Element).closest('button, [role="treeitem"]');
      if (target)
        events.push({
          at: performance.now(),
          type: eventType,
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
const frameObserver = new PerformanceObserver((list) => {
  longAnimationFrames.push(...list.getEntries().map((entry) => entry.toJSON()));
});
if (PerformanceObserver.supportedEntryTypes.includes("long-animation-frame"))
  frameObserver.observe({ type: "long-animation-frame", buffered: false });
const panel = document.createElement("details");
panel.style.cssText =
  "position:fixed;right:12px;top:130px;z-index:1000;background:white;max-width:480px;max-height:60vh;overflow:auto;padding:8px;font:12px system-ui";
panel.innerHTML =
  '<summary>S1 Diagnose</summary><button id="s1-start">Messung neu starten</button> <button id="s1-check">Modellvergleich ausführen</button> <button id="s1-trace">Messung abschließen</button><pre id="s1-result"></pre>';
document.body.append(panel);
const comparisonButton = document.createElement("button");
comparisonButton.textContent = "Abbild-Gegenmessung starten";
panel.insertBefore(comparisonButton, panel.querySelector("pre"));
comparisonButton.addEventListener("click", async () => {
  comparisonButton.disabled = true;
  comparisonButton.textContent = "Gegenmessung läuft – bitte nicht bedienen";
  try {
    const result = await compareImageSwitches();
    panel.querySelector("pre")!.textContent = JSON.stringify(result, null, 2);
    comparisonButton.textContent = "Gegenmessung abgeschlossen";
  } catch (error) {
    panel.querySelector("pre")!.textContent = String(error);
    comparisonButton.textContent = "Gegenmessung fehlgeschlagen";
  } finally {
    comparisonButton.disabled = false;
  }
});
const report: Record<string, unknown> = {
  variant: mixed ? "GB" : "G",
  imageUrls: shortImageUrls ? "diagnostic-blob" : "production-data",
  imagePaint: hideImages ? "diagnostic-hidden" : "visible",
  userAgent: navigator.userAgent,
  viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
  events,
  longtasks,
  longAnimationFrames,
  longAnimationFrameSupported:
    PerformanceObserver.supportedEntryTypes.includes("long-animation-frame"),
  workspacePhases,
};
const show = () => {
  report["imageResources"] = imageResourcePilotStats();
  panel.querySelector("#s1-result")!.textContent = JSON.stringify(report, null, 2);
};
panel.querySelector("#s1-start")!.addEventListener("click", () => {
  observer.takeRecords();
  frameObserver.takeRecords();
  longAnimationFrames.length = 0;
  events.length = longtasks.length = frames.length = workspacePhases.length = 0;
  report["measurementStart"] = performance.now();
  report["measurementEnd"] = null;
  last = performance.now();
  if (!running) requestAnimationFrame(frame);
  running = true;
  if (PerformanceObserver.supportedEntryTypes.includes("longtask"))
    observer.observe({ entryTypes: ["longtask"] });
  if (PerformanceObserver.supportedEntryTypes.includes("long-animation-frame"))
    frameObserver.observe({ type: "long-animation-frame", buffered: false });
  show();
});
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
  longAnimationFrames.push(...frameObserver.takeRecords().map((entry) => entry.toJSON()));
  frameObserver.disconnect();
  report["measurementEnd"] = performance.now();
  report["frames"] = frames;
  show();
});
