import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";

export type IconButtonVariant = "plain" | "floating" | "accent" | "inverse";
export type IconButtonSize = "sm" | "md" | "lg";

export type IconButtonProps = Omit<ComponentProps<"button">, "aria-label"> & {
  /** 纯图标控件必须有可访问名称 */
  "aria-label": string;
  /**
   * - `plain` 方形浅灰底，工具栏与顶栏，默认；
   * - `floating` 圆形白底 + 环境阴影，翻页与浮在图像上的操作；
   * - `accent` 方形，悬停或激活时变信号黄；
   * - `inverse` 方形，悬停或激活时变墨底；它打开的菜单、展开条开着的时候也是。
   */
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** 开关类按钮的激活状态，同时输出 `aria-pressed` */
  pressed?: boolean;
};

const sizeClass: Record<IconButtonSize, string> = {
  // 32px 小于触屏的最小点击区，用伪元素向外补到 40px。
  // 高对比模式下多了一圈 1px 的线，伪元素是从线的里沿起算的，多补 1px 才还是 40px
  sm: "size-8 after:absolute after:-inset-1 after:content-[''] forced-colors:after:-inset-[5px] [&_svg]:size-4",
  md: "size-10 [&_svg]:size-5",
  lg: "size-12 [&_svg]:size-6",
};

const restClass =
  "bg-surface-sunken text-ink-secondary hover:bg-surface-muted hover:text-ink active:bg-line";

const enabledClass: Record<IconButtonVariant, string> = {
  plain: restClass,
  // 有意不随主题翻转：它要压在图像和深色版块上
  floating:
    "bg-neutral-50 text-neutral-900 shadow-sm hover:bg-neutral-200 active:bg-neutral-300",
  accent:
    "bg-surface-sunken text-ink-secondary hover:bg-action hover:text-on-action active:bg-action-pressed",
  inverse:
    // data-popup-open 是浮层基元写在触发元素上的：它打开的东西还开着
    "bg-surface-sunken text-ink-secondary hover:bg-surface-inverse hover:text-accent-ink-inverse active:bg-surface-inverse data-popup-open:bg-surface-inverse data-popup-open:text-accent-ink-inverse",
};

const pressedClass: Record<IconButtonVariant, string> = {
  plain: "bg-surface-muted text-ink active:bg-line",
  floating: "bg-neutral-200 text-neutral-900 shadow-sm active:bg-neutral-300",
  accent: "bg-action text-on-action active:bg-action-pressed",
  inverse: "bg-surface-inverse text-accent-ink-inverse",
};

/*
 * 高对比模式下底色都被系统换掉：没激活的只剩一个图标，看不出是按钮；激活的和没激活的也成了
 * 一个样子。所以都补一圈线（圆的那种是圆圈）——没激活的是按钮的字色，禁用的是灰字色，
 * 激活的整块改用系统的"选中"色。线三种状态都有，换状态时图标不会挪
 */
const outlineForced = "forced-colors:border";
const enabledForced = "forced-colors:border-[ButtonText]";
const pressedForced =
  "forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";
const disabledForced = "forced-colors:border-[GrayText]";

const disabledClass: Record<IconButtonVariant, string> = {
  plain: "cursor-not-allowed bg-surface-sunken text-ink-disabled",
  floating: "cursor-not-allowed bg-neutral-50 text-neutral-400 shadow-sm",
  accent: "cursor-not-allowed bg-surface-sunken text-ink-disabled",
  inverse: "cursor-not-allowed bg-surface-sunken text-ink-disabled",
};

export function IconButton({
  variant = "plain",
  size = "md",
  pressed,
  disabled = false,
  type = "button",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-pressed={pressed}
      data-variant={variant}
      data-size={size}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        // 方形的三种和按钮一样是 4px 微圆角；浮动的那种是圆
        variant === "floating" ? "rounded-full" : "rounded-sm",
        "transition-colors duration-(--duration-fast) ease-standard",
        focusRing,
        sizeClass[size],
        outlineForced,
        disabled
          ? [disabledClass[variant], disabledForced]
          : pressed
            ? [pressedClass[variant], pressedForced]
            : [enabledClass[variant], enabledForced],
        className,
      )}
    >
      {children}
    </button>
  );
}
