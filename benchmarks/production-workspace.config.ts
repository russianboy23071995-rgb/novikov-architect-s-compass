import { recoveryReadInstrumentation } from "./recovery-read-instrumentation";
import { workspaceLoadInstrumentation } from "./workspace-load-instrumentation";
import { exportInstrumentation } from "./export-instrumentation";
import { imageResourceInstrumentation } from "./image-resource-instrumentation";
import { renderInstrumentation } from "./render-instrumentation";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
// Same real workspace/adapters; transforms only in explicit diagnostic modes.
// Separate static build/origin; does not replace the deployment/SSR build.
export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === "recovery-profile" ? [recoveryReadInstrumentation()] : []),
    ...(mode === "export-profile" ? [exportInstrumentation()] : []),
    ...(mode === "render-profile" ? [renderInstrumentation()] : []),
    ...(["load-profile", "image-resources"].includes(mode)
      ? [workspaceLoadInstrumentation(true)]
      : []),
    ...(mode === "image-resources" ? [imageResourceInstrumentation()] : []),
    react(),
    tailwind(),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  build: {
    outDir: "dist-production-workspace",
    // js-profile: readable stacks for the JS Self-Profiling API (docs/performance/EDIT_CYCLE.md).
    ...(mode === "js-profile" ? { minify: false } : {}),
    rollupOptions: {
      input: [
        "benchmarks/production-workspace.html",
        "benchmarks/s1-workspace.html",
        "benchmarks/school-acceptance.html",
      ],
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 8085,
    strictPort: true,
    ...(mode === "js-profile" ? { headers: { "Document-Policy": "js-profiling" } } : {}),
  },
}));
