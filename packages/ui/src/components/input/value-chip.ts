import type { ControlSize } from "./control-box";

/*
 * 已经定下来的值在框里排成的小块：组合框的多选、标签输入共用。
 * 直角——它是值，不是会自己变的状态。右端一个删除叉。
 */

/** 小块高 20 / 24 / 32px，跟着外框的三档 */
export const valueChipSize: Record<ControlSize, string> = {
  sm: "h-5 text-xs",
  md: "h-6 text-sm",
  lg: "h-8 text-base",
};

export const valueChip =
  "flex max-w-full min-w-0 cursor-default items-center bg-surface-muted pl-2 text-ink";

/** 小块右端的删除叉：一个和小块等高的方钮 */
export const valueChipRemove =
  "flex aspect-square h-full shrink-0 items-center justify-center text-ink-secondary hover:bg-line hover:text-ink";

/** 和小块排在一起的那个输入框：和小块一样高，这一行才不会比小块高出一截 */
export const valueInputHeight: Record<ControlSize, string> = {
  sm: "h-5",
  md: "h-6",
  lg: "h-8",
};

/** 多选时外框只定最小高度：小块多了会换行、外框跟着长高 */
export const multiValueBox: Record<ControlSize, string> = {
  sm: "min-h-8 text-sm",
  md: "min-h-10 text-base",
  lg: "min-h-14 text-lg",
};
