import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "app",
  base: "/gpxviewer/",
  publicDir: path.resolve(import.meta.dirname, "static"),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(import.meta.dirname)],
    },
  },
  test: {
    root: import.meta.dirname,
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
  build: {
    outDir: "../public",
    emptyOutDir: true,
  },
});
