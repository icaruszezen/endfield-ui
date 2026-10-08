import { createContext } from "react";
import { focusRingInset } from "../../lib/focus-ring";

/*
 * 下拉菜单与下拉选择共用的面板和选项。
 * - `plain` 跟随主题的面板，当前项是浅灰底 + 左缘墨色条；
 * - `strong` 官网语言菜单的样子：固定的深色面板，当前项整行黄底墨字。
 *   面板自己是一个 `data-theme="dark"` 的局部主题，所以下面的类不用分两套写。
 */
export type MenuVariant = "plain" | "strong";

/** 选项要知道自己在哪种面板里，才知道"当前项"怎么画 */
export const MenuVariantContext = createContext<MenuVariant>("plain");

/** 面板：直角、1px 线、环境阴影；顶部一条半宽的行动色细条，展开时从 0 伸到一半宽 */
export const menuPanel = [
  "relative min-w-40 border border-line bg-surface-raised py-1 text-ink shadow-sm outline-none",
  "origin-(--transform-origin) transition-opacity duration-(--duration-fast) ease-standard",
  "data-ending-style:opacity-0 data-starting-style:opacity-0",
  "before:pointer-events-none before:absolute before:-top-px before:-left-px before:h-[3px] before:w-1/2 before:origin-left before:bg-action before:content-['']",
  "before:transition-transform before:duration-(--duration-base) before:ease-exit data-starting-style:before:scale-x-0",
  "forced-colors:before:hidden",
].join(" ");

/**
 * 选项：键盘或指针经过时提亮一档；键盘聚焦另有一圈画在里面的焦点环。
 * 这里不能写 `outline-none`：它把轮廓的线型定成 none，后面的焦点环也跟着画不出来
 */
export const menuItem = [
  "relative flex min-h-9 cursor-default items-center gap-2 px-3 py-1.5 text-sm select-none",
  "data-disabled:text-ink-disabled",
  focusRingInset,
].join(" ");

/** 不是当前项的选项才有悬停底：当前项的底不能被悬停盖掉 */
export const menuItemHover = "data-highlighted:bg-ink/5";

/** 当前项（下拉选择的已选项、单选菜单项的选中项） */
export const menuItemCurrent: Record<MenuVariant, string> = {
  plain:
    "bg-surface-muted font-medium before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-ink before:content-['']",
  strong: "bg-action font-medium text-on-action",
};

export const menuGroupLabel = "px-3 pt-2 pb-1 text-xs text-ink-tertiary";

export const menuSeparator = "my-1 h-px bg-line";
