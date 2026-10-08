import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  platform: "neutral",
  dts: true,
  clean: true,
  // 带状态的组件（Tabs、SectionTitle）在 RSC 环境下必须是客户端组件
  banner: { js: '"use client";' },
});
