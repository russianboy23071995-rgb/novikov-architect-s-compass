/** Isolated display acceptance; never imported by product routes or saved to projects. */
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { HatchPattern } from "../src/components/cad/HatchPattern";
import { hatchPatternTile, type HatchPatternSizing } from "../src/rendering/viewport/hatch-pattern";
import type { ScaleContext } from "../src/domain/views/scale";
import "../src/styles.css";

const definition = {
  id: "pilot",
  name: "Asymmetrische Zelle",
  width: 0.2,
  height: 0.3,
  lines: [
    { start: { x: 0, y: 0.3 }, end: { x: 0.2, y: 0 } },
    { start: { x: 0, y: 0.3 }, end: { x: 0.08, y: 0.3 } },
  ],
};
const points = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 1.5 },
  { x: 0, y: 1.5 },
];
export function App() {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const hatch = {
    points,
    fill: { color: "#168e98", opacity: 1 },
    pattern: {
      patternId: definition.id,
      mode: "model" as const,
      origin: { x: 0, y: 0 },
      rotation,
    },
  };
  const examples = ["Modellmaß", "Papiermaß 1:50", "Papiermaß 1:100"];
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Schraffurmaßstab · isolierter Darstellungspilot</h1>
      <p>
        Gleiche Kontur und Definition. Papier-Zellbreite: 2 mm. Keine Projektänderung oder
        Druckvorschau.
      </p>
      <label>
        Zoom{" "}
        <select
          aria-label="Zoom px/m"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        >
          {[25, 100, 400].map((v) => (
            <option key={v} value={v}>
              {v} px/m
            </option>
          ))}
        </select>
      </label>{" "}
      <label>
        Musterwinkel{" "}
        <select
          aria-label="Musterwinkel"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
        >
          {[0, 45, 90].map((v) => (
            <option key={v} value={v}>
              {v}°
            </option>
          ))}
        </select>
      </label>
      <p>Jeder Musterstrich bleibt 1 CSS-Pixel breit. Zoom ändert nur die Bildschirmgröße.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {examples.map((label, index) => {
          const context: ScaleContext = {
            view: { kind: "working-plan", projectId: "pilot", storeyId: "s" },
            denominator: index === 1 ? 50 : 100,
          };
          const sizing: HatchPatternSizing =
            index === 0 ? { mode: "model" } : { mode: "paper", paperWidthMetres: 0.002, context };
          const tile = hatchPatternTile(definition, hatch.pattern, sizing)!;
          return (
            <section
              key={label}
              aria-label={label}
              style={{ padding: 12, border: "1px solid #aaa", borderRadius: 8 }}
            >
              <h2>{label}</h2>
              <p>
                Zelle im Modell: {tile.width.toFixed(2)} × {tile.height.toFixed(2)} m
              </p>
              <svg
                aria-label={`${label} Vorschau`}
                width={2 * zoom}
                height={1.5 * zoom}
                viewBox="0 -1.5 2 1.5"
                style={{ background: "white", outline: "1px solid #ccc" }}
              >
                <HatchPattern
                  hatch={hatch}
                  definition={definition}
                  pixelsPerMetre={zoom}
                  sizing={sizing}
                />
              </svg>
            </section>
          );
        })}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
