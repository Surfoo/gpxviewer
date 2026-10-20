import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "app",
  base: "/gpxviewer/",
  publicDir: path.resolve(__dirname, "static"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname)],
    },
  },
  test: {
    root: __dirname,
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
  build: {
    outDir: "../public",
    emptyOutDir: true,
  },
});
