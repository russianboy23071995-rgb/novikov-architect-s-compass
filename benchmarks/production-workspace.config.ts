import { recoveryReadInstrumentation } from "./recovery-read-instrumentation";
import { workspaceLoadInstrumentation } from "./workspace-load-instrumentation";
import { exportInstrumentation } from "./export-instrumentation";
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
    ...(mode === "load-profile" ? [workspaceLoadInstrumentation(true)] : []),
    react(),
    tailwind(),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  build: {
    outDir: "dist-production-workspace",
    rollupOptions: { input: "benchmarks/production-workspace.html" },
  },
  preview: { host: "127.0.0.1", port: 8085, strictPort: true },
}));
