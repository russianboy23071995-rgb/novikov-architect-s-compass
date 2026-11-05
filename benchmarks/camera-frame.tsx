import React, { useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { BimSolidView } from "../src/components/cad/BimSolidView";
import { createExampleProject } from "../src/components/cad/bim-view";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid";
import { initialCamera } from "../src/lib/bim/geometry";
import {
  createProjectionFrame,
  projectionDepthRadius,
} from "../src/geometry/projections/orthographic";
import { cameraMatrix } from "../src/geometry/projections/camera-matrix";
import { orbitAround } from "../src/rendering/viewport/camera-navigation";
import "../src/styles.css";

// Isolated in-memory fixture. No project/recovery storage and no production instrumentation.
const project = createExampleProject();
const solid = buildBuildingSolid(project);
const frame = createProjectionFrame(solid);
const depthFrame = { ...frame, depthRadius: projectionDepthRadius(frame, solid) };
let submitted: number[] = [];
let glError = 0;
const original = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  ...args: Parameters<typeof original>
) {
  const context = original.apply(this, args);
  if (args[0] === "webgl" && context && !(context as unknown as { tracked?: boolean }).tracked) {
    const gl = context as WebGLRenderingContext;
    (gl as unknown as { tracked: boolean }).tracked = true;
    const upload = gl.uniformMatrix4fv.bind(gl);
    gl.uniformMatrix4fv = (location, transpose, matrix) => {
      submitted = Array.from(matrix);
      upload(location, transpose, matrix);
    };
    const draw = gl.drawArrays.bind(gl);
    gl.drawArrays = (...values) => {
      draw(...values);
      glError ||= gl.getError();
    };
  }
  return context;
} as typeof original;
export function App() {
  const [camera, setCamera] = useState(initialCamera);
  const moves = useRef(0);
  function boundaryTest() {
    setResult("Armed: drag across the canvas. A simulated browser exit occurs during capture.");
    const canvas = document.querySelector("canvas")!;
    canvas.addEventListener(
      "pointerdown",
      () => {
        setTimeout(() => {
          document.dispatchEvent(new PointerEvent("pointerout", { relatedTarget: null }));
          const count = moves.current;
          setTimeout(
            () =>
              setResult(
                moves.current === count
                  ? "PASS: no camera updates after simulated browser exit"
                  : "FAIL: camera continued after exit",
              ),
            700,
          );
        }, 10);
      },
      { once: true },
    );
  }
  const [result, setResult] = useState(
    "Ready: one wall with opening; slow orbit and pan, 160 frames.",
  );
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    let failures = 0,
      first = "";
    const canvas = document.querySelector("canvas")!;
    const aspect = canvas.width / canvas.height;
    const base = { ...initialCamera, panX: 0.23, panY: -0.17 };
    const pivot = frame.center;
    for (let i = 0; i < 160; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const next =
        i < 80
          ? orbitAround(frame, base, aspect, pivot, i * 0.15, i * 0.08)
          : { ...base, panX: base.panX + (i - 80) * 0.001, panY: base.panY - (i - 80) * 0.001 };
      flushSync(() => setCamera(next));
      // At the commit boundary, DOM and GPU must already represent the same camera.
      const expected = Array.from(cameraMatrix(depthFrame, next, aspect, frame.center));
      if (submitted.length !== 16 || expected.some((v, k) => Math.abs(v - submitted[k]!) > 1e-6)) {
        failures++;
        first ||= `frame ${i}`;
      }
    }
    setResult(
      `${failures === 0 && glError === 0 ? "PASS" : "FAIL"}: 160 frames, ${failures} stale GPU matrices, WebGL error ${glError}. ${first}`,
    );
    setBusy(false);
  }
  return (
    <>
      <h1>Camera / GPU frame synchronization</h1>
      <p>Isolated fixture; no user data changes.</p>
      <button onClick={() => void run()} disabled={busy}>
        Run slow camera test
      </button>
      <button onClick={boundaryTest} disabled={busy}>
        Arm boundary test
      </button>
      <pre role="status">{result}</pre>
      <div style={{ position: "relative", width: 900, height: 500 }}>
        <BimSolidView
          project={project}
          selection={null}
          camera={camera}
          onCamera={(next) => {
            moves.current++;
            setCamera(next);
          }}
          projectionFrame={frame}
          pan={false}
          ortho={false}
          onSelect={() => {}}
        />
      </div>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
