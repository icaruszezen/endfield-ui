import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", game: "src/game/index.ts" },
  root: "src",
  unbundle: true,
  format: "esm",
  platform: "neutral",
  dts: true,
  clean: true,
  minify: true,
  outputOptions: { comments: { annotation: true, legal: true, jsdoc: false } },
  banner: { js: '"use client";' },
});
