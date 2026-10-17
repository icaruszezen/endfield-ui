import { cn } from "../../lib/cn";
import { focusRingWithin } from "../../lib/focus-ring";

/*
 * 输入框与多行文本共用的外框，直角，两种画法：
 * - `sunken` 凹陷的底 + 一条 2px 的底边线，默认；
 * - `outline` 四边 1px 的描边 + 页面底色，放在凹陷底色的区域里时用。
 * 状态靠边线说：默认灰 → 悬停深一档 → 错误红；聚焦另画一条墨线。
 */

export type ControlVariant = "sunken" | "outline";
export type ControlSize = "sm" | "md" | "lg";

/** 32 / 40 / 56px 高，字号跟随通用的三档。输入框和下拉选择的触发器共用 */
export const controlSize: Record<ControlSize, string> = {
  sm: "h-8 text-sm",
  md: "h-10 text-base",
  lg: "h-14 text-lg",
};

export const controlIconSize: Record<ControlSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

type BoxState = {
  variant?: ControlVariant;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
};

const frame: Record<ControlVariant, string> = {
  sunken: "border-b-2",
  outline: "border",
};

const fill: Record<ControlVariant, string> = {
  sunken: "bg-surface-sunken",
  outline: "bg-surface",
};

/* 画在 `::before` 上：分段选择的 `::after` 是选中的那块底 */
const lineFrame: Record<ControlVariant, string> = {
  sunken:
    "before:pointer-events-none before:absolute before:inset-x-0 before:-bottom-[2px] before:h-[2px] before:origin-left before:scale-x-0 before:bg-ink before:content-[''] forced-colors:before:bg-[Highlight]",
  outline:
    "before:pointer-events-none before:absolute before:-inset-px before:border before:border-ink before:[clip-path:inset(0_100%_0_0)] before:content-['']",
};

const lineOpen: Record<ControlVariant, string> = {
  sunken:
    "focus-within:before:scale-x-100 has-data-popup-open:before:scale-x-100",
  outline:
    "focus-within:before:[clip-path:inset(0)] has-data-popup-open:before:[clip-path:inset(0)]",
};

/* 擦出 300ms、收回 200ms */
const lineMotion =
  "before:transition-[scale,clip-path] before:duration-(--duration-fast) before:ease-standard focus-within:before:duration-(--duration-base) focus-within:before:ease-exit has-data-popup-open:before:duration-(--duration-base) has-data-popup-open:before:ease-exit";

/** 聚焦的墨线，接在带 `relative` 的外框上用 */
export function controlLine(variant: ControlVariant = "sunken") {
  return cn(lineFrame[variant], lineOpen[variant], lineMotion);
}

export function controlBox({
  variant = "sunken",
  invalid,
  disabled,
  readOnly,
}: BoxState) {
  return cn(
    "relative flex w-full min-w-0 text-ink",
    frame[variant],
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRingWithin,
    readOnly
      ? // 只读：没有边线、底变透明。边线留透明的，尺寸不跳
        "border-transparent bg-transparent"
      : fill[variant],
    // 高对比模式下系统会把透明的边线也换成字色显出来，而底色本来就都没了：
    // 只读的写成页面色，不然和能填的一个样
    readOnly && !disabled && !invalid && "forced-colors:border-[Canvas]",
    disabled
      ? "cursor-not-allowed border-line text-ink-disabled"
      : invalid
        ? "border-danger"
        : !readOnly &&
          // 悬停只在没聚焦时生效：生成的 CSS 里 hover 排在 focus-within 之后，会盖掉聚焦的墨色
          "border-line-strong hover:not-focus-within:border-ink-secondary",
    !disabled && !invalid && !readOnly && controlLine(variant),
  );
}

/**
 * 框里真正的 `<input>` / `<textarea>`：没有自己的底和边，焦点环画在外框上。
 *
 * 高对比模式下禁用的字色要自己写明：平时的 `ink-disabled` 写在外框上，系统换掉之后
 * 只有它自己认得的禁用控件才是灰字色——`<textarea>`、写了 `type` 的 `<input>` 认得，
 * 没写 `type` 的 `<input>`（输入框、组合框都是）不认，字和没禁用的一个颜色
 */
export const controlElement =
  "min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-tertiary disabled:cursor-not-allowed disabled:placeholder:text-ink-disabled forced-colors:disabled:text-[GrayText]";

/**
 * 框里跟着禁用变浅、但自己不是控件的字（计数）：`ink-disabled` 写在 `<span>` 上，
 * 高对比模式下系统当普通字换掉，写明灰字色
 */
export const controlDisabledText =
  "text-ink-disabled forced-colors:text-[GrayText]";
