import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// Actual CadWorkspace production build, without diagnostic instrumentation/HMR.
export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  build: {
    outDir: "dist-height-acceptance",
    rollupOptions: { input: "benchmarks/bound-height-workspace.html" },
  },
  preview: { host: "127.0.0.1", port: 8087, strictPort: true },
});
