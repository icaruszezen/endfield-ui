import { cn } from "../../lib/cn";
import { focusRingWithin } from "../../lib/focus-ring";

/*
 * 输入框与多行文本共用的外框：凹陷的底 + 一条 2px 的底边线，直角。
 * 状态靠底边线的颜色变化：默认灰 → 悬停深一档 → 聚焦墨 → 错误红。
 */

type BoxState = {
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
};

export function controlBox({ invalid, disabled, readOnly }: BoxState) {
  return cn(
    "flex w-full min-w-0 border-b-2 text-ink",
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRingWithin,
    readOnly
      ? // 只读：没有底边线、底变透明。边线留一条透明的，高度不跳
        "border-transparent bg-transparent"
      : "bg-surface-sunken",
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
