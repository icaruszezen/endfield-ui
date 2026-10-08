import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import "./preview.css";

type ThemeMode = "light" | "dark" | "both";

/**
 * 亮 / 暗：把主题写到 <html>，和真实页面的用法一致。
 * 并排：同一个 story 渲染进两个局部主题容器，一眼对比两套取值。
 */
function ThemeFrame({
  mode,
  fill,
  children,
}: {
  mode: ThemeMode;
  /** 单个 story 的画布撑满视口；文档页里内嵌的 story 按内容高度 */
  fill: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.dataset.theme = mode === "dark" ? "dark" : "light";
  }, [mode]);

  if (mode !== "both") {
    return <div className="p-6">{children}</div>;
  }

  return (
    <div className={fill ? "grid min-h-screen lg:grid-cols-2" : "grid lg:grid-cols-2"}>
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} data-theme={theme} className="bg-surface p-6 text-ink">
          <p className="mb-4 font-tech text-xs text-ink-tertiary uppercase">
            {`// ${theme}`}
          </p>
          {children}
        </div>
      ))}
    </div>
  );
}

const withTheme: Decorator = (Story, context) => (
  <ThemeFrame
    mode={context.globals.theme as ThemeMode}
    fill={context.viewMode === "story"}
  >
    <Story />
  </ThemeFrame>
);

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "主题",
      toolbar: {
        title: "主题",
        icon: "mirror",
        dynamicTitle: true,
        items: [
          { value: "light", title: "亮色", icon: "sun" },
          { value: "dark", title: "暗色", icon: "moon" },
          { value: "both", title: "并排", icon: "sidebyside" },
        ],
      },
    },
  },
  initialGlobals: { theme: "both" },
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    options: {
      storySort: { order: ["示例", "控件", "母题"] },
    },
  },
  tags: ["autodocs"],
};

export default preview;
