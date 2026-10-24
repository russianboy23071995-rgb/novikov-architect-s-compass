import { defineConfig } from "vite";
export default defineConfig({
  build: {
    outDir: "dist-primitive-browser",
    rollupOptions: { input: "benchmarks/primitive-browser.html" },
  },
  preview: { host: "127.0.0.1", port: 8091, strictPort: true },
});
