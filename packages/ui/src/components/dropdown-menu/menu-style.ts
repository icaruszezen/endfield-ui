import { focusRingInset } from "../../lib/focus-ring";
import { enterFromSide } from "../../lib/motion";
import { createLazyContext } from "../../lib/create-lazy-context";

/*
 * 下拉菜单与下拉选择共用的面板和选项。
 * - `plain` 跟随主题的面板，当前项是浅灰底 + 左缘墨色条；
 * - `strong` 官网语言菜单的样子：固定的深色面板，当前项整行黄底墨字。
 *   面板自己是一个 `data-theme="dark"` 的局部主题，所以下面的类不用分两套写。
 */
export type MenuVariant = "plain" | "strong";

/** 选项要知道自己在哪种面板里，才知道"当前项"怎么画 */
export const getMenuVariantContext =
  /* @__PURE__ */ createLazyContext<MenuVariant>("plain");

/**
 * 面板：直角、1px 线、环境阴影；顶部一条半宽的行动色细条，展开时从 0 伸到一半宽。
 *
 * 细条上挂一个朝下的小三角，和它是同一个伪元素裁出来的：条高 3px，三角露出 8×4px，
 * 中心距条的左端 32px（实机风格弹窗分隔条的一半大）。它是条上的记号，不指向触发处——
 * 面板翻到上面、在侧边时照旧在顶上、朝下。三角探进第一行 2px，所以压在各行的底色之上
 *
 * 进场：淡入（200ms），同时从触发处那一侧挪过来 4px（300ms，和细条同一拍）。
 * 退场只淡出——位移只写在起点上。两个时长、两条缓动按属性一一对应
 */
export const menuPanel = [
  "relative min-w-40 border border-line bg-surface-raised py-1 text-ink shadow-sm outline-none",
  "origin-(--transform-origin) transition-[opacity,translate] duration-[var(--duration-fast),var(--duration-base)] ease-[var(--ease-standard),var(--ease-exit)]",
  "data-ending-style:opacity-0 data-starting-style:opacity-0",
  enterFromSide,
  "before:pointer-events-none before:absolute before:-top-px before:-left-px before:z-1 before:h-[7px] before:w-1/2 before:origin-left before:bg-action before:content-['']",
  "before:[clip-path:polygon(0_0,100%_0,100%_3px,36px_3px,32px_100%,28px_3px,0_3px)]",
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

/**
 * 当前项（下拉选择的已选项、单选菜单项的选中项）。
 *
 * `strong` 的当前项是一整行黄底，而面板是深色的局部主题，焦点色也是黄的：
 * 画在里面的焦点环换成压得住黄底的颜色，并且再往里收 2px——那个颜色是墨色，
 * 贴着边的话和深色的面板分不开，看上去只是黄底小了一圈。
 *
 * 高对比模式下底色都被系统换掉：两种面板的当前项都是左缘一条系统"选中"色的竖条
 * （`strong` 平时没有这一条，只在这时候画）
 */
export const menuItemCurrent: Record<MenuVariant, string> = {
  plain:
    "bg-surface-muted font-medium before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-ink before:content-[''] forced-colors:before:bg-[Highlight]",
  strong:
    "bg-action font-medium text-on-action focus-visible:-outline-offset-4 focus-visible:outline-on-action forced-colors:before:absolute forced-colors:before:inset-y-0 forced-colors:before:left-0 forced-colors:before:w-[3px] forced-colors:before:bg-[Highlight] forced-colors:before:content-['']",
};

export const menuGroupLabel = "px-3 pt-2 pb-1 text-xs text-ink-tertiary";

export const menuSeparator = "my-1 h-px bg-line";
