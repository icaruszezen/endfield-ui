import { cn } from "../../lib/cn";
import { focusRingWithin } from "../../lib/focus-ring";

/*
 * 输入框与多行文本共用的外框，直角，两种画法：
 * - `sunken` 凹陷的底 + 一条 2px 的底边线，默认；
 * - `outline` 四边 1px 的描边 + 页面底色，放在凹陷底色的区域里时用。
 * 状态都靠边线的颜色变化：默认灰 → 悬停深一档 → 聚焦墨 → 错误红。
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

export function controlBox({
  variant = "sunken",
  invalid,
  disabled,
  readOnly,
}: BoxState) {
  return cn(
    "flex w-full min-w-0 text-ink",
    frame[variant],
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRingWithin,
    readOnly
      ? // 只读：没有边线、底变透明。边线留透明的，尺寸不跳
        "border-transparent bg-transparent"
      : fill[variant],
    disabled
      ? "cursor-not-allowed border-line text-ink-disabled"
      : invalid
        ? "border-danger"
        : !readOnly &&
          // 悬停只在没聚焦时生效：生成的 CSS 里 hover 排在 focus-within 之后，会盖掉聚焦的墨色
          "border-line-strong hover:not-focus-within:border-ink-secondary focus-within:border-ink",
  );
}

/** 框里真正的 `<input>` / `<textarea>`：没有自己的底和边，焦点环画在外框上 */
export const controlElement =
  "min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-tertiary disabled:cursor-not-allowed disabled:placeholder:text-ink-disabled";
