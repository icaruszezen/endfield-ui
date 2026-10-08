import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  // 画布的底色由主题令牌决定，不用 Storybook 自带的背景切换
  features: { backgrounds: false },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        alias: [
          {
            // 直接指向组件库源码：改组件即热更新，不用先构建。
            // 只匹配包名本身，`@endfield-ui/react/tailwind.css` 仍走包的 exports
            find: /^@endfield-ui\/react$/,
            replacement: fileURLToPath(
              new URL("../../../packages/ui/src/index.ts", import.meta.url),
            ),
          },
        ],
      },
    }),
};

export default config;
