import { focusRingInset } from "../../lib/focus-ring";

/*
 * 弹窗与抽屉共用的外观：遮罩、深色标题带、关闭按钮。
 * 标题带在亮、暗两个主题下都是深色，所以它自己是一个 `data-theme="dark"` 的
 * 局部主题：里面的文字、关闭图标、焦点环都按深色底取值，不用逐个写死。
 */

/** 遮罩：纯黑半透明（亮 50% / 暗 70%），不模糊、不带色彩 */
export const overlayBackdrop =
  "fixed inset-0 z-(--z-overlay) bg-scrim transition-opacity duration-(--duration-fast) ease-standard data-ending-style:opacity-0 data-starting-style:opacity-0";

/** 标题带的底：深色 + 斜纹。用的时候在元素上加 `data-theme="dark"` */
export const overlayHeader =
  "hatch relative flex shrink-0 items-center border-b border-line bg-surface-raised text-ink";

/** 关闭按钮：24px 的叉、40px 的点击区，悬停转 90° */
export const overlayClose = [
  "absolute top-1/2 right-1 inline-flex size-10 -translate-y-1/2 items-center justify-center text-ink",
  // 按下的浅灰是官网实测值的近似，只出现在深色带上
  "active:text-neutral-300",
  "[&_svg]:transition-transform [&_svg]:duration-(--duration-base) [&_svg]:ease-standard hover:[&_svg]:rotate-90",
  focusRingInset,
].join(" ");

/** 浮层的面：直角、中性底、环境阴影。高对比模式下阴影不显示，补一圈边线 */
export const overlaySurface =
  "bg-surface-raised text-ink shadow-lg outline-none forced-colors:border";
