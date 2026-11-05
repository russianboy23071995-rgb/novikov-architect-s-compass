import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const candidate = fileURLToPath(
  new URL("../src/rendering/viewport/storey-solid.browser-resource.ts", import.meta.url),
);
export default defineConfig({
  plugins: [
    {
      name: "archived-resource-candidate",
      resolveId(id) {
        if (id === "./archived-wall-resource") return candidate;
        return null;
      },
      load(id) {
        if (id === candidate)
          return readFileSync(new URL("./wall-resource-candidate.txt", import.meta.url), "utf8");
        return null;
      },
    },
  ],
  build: {
    outDir: "dist-resource-browser",
    rollupOptions: { input: "benchmarks/wall-resource-browser.html" },
  },
  preview: { host: "127.0.0.1", port: 8089, strictPort: true },
});
