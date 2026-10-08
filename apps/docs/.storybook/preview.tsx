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
  bleed,
  children,
}: {
  mode: ThemeMode;
  /** 单个 story 的画布撑满视口；文档页里内嵌的 story 按内容高度 */
  fill: boolean;
  /** 页面自己占满视口（带外壳的示例页）：不加内边距 */
  bleed: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.dataset.theme = mode === "dark" ? "dark" : "light";
  }, [mode]);

  if (mode !== "both") {
    // 文字色显式写在外壳上，不只靠 body 继承：主题是挂载后才写到 <html> 上的，
    // 无头浏览器截图时继承来的颜色偶尔停在切换前
    return (
      <div className={bleed ? "text-ink" : "p-6 text-ink"}>{children}</div>
    );
  }

  return (
    <div
      className={
        fill ? "grid min-h-screen lg:grid-cols-2" : "grid lg:grid-cols-2"
      }
    >
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

const withTheme: Decorator = (Story, context) => {
  const requested = context.globals.theme as ThemeMode;
  // 弹窗、抽屉、轻提示占的是整个视口，同一个 story 不能并排开两份。
  // 这些 story 写 parameters: { sideBySide: false }，并排模式下只渲染亮色，暗色用工具栏切
  const single =
    requested === "both" && context.parameters.sideBySide === false;
  // 自己占满视口的页面写 parameters: { bleed: true }：不要内边距，也不要顶上那行说明
  const bleed = context.parameters.bleed === true;
  return (
    <ThemeFrame
      mode={single ? "light" : requested}
      fill={context.viewMode === "story"}
      bleed={bleed}
    >
      {/* 文档页里每个 story 都会套一层外壳，说明只在单独打开时出现一次 */}
      {single && !bleed && context.viewMode === "story" && (
        <p className="mb-4 font-tech text-xs text-ink-tertiary uppercase">
          // 这一页不并排：用工具栏的"主题"切换亮暗
        </p>
      )}
      <Story />
    </ThemeFrame>
  );
};

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
