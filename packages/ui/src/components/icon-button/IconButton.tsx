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
  // 32px 小于触屏的最小点击区，用伪元素向外补到 40px
  sm: "size-8 after:absolute after:-inset-1 after:content-[''] [&_svg]:size-4",
  md: "size-10 [&_svg]:size-5",
  lg: "size-12 [&_svg]:size-6",
};

const restClass =
  "bg-surface-sunken text-ink-secondary hover:bg-surface-muted hover:text-ink active:bg-line";

const enabledClass: Record<IconButtonVariant, string> = {
  plain: restClass,
  // 有意不随主题翻转：它要压在图像和深色版块上
  floating:
    "rounded-full bg-neutral-50 text-neutral-900 shadow-sm hover:bg-neutral-200 active:bg-neutral-300",
  accent:
    "bg-surface-sunken text-ink-secondary hover:bg-action hover:text-on-action active:bg-action-pressed",
  inverse:
    // data-popup-open 是浮层基元写在触发元素上的：它打开的东西还开着
    "bg-surface-sunken text-ink-secondary hover:bg-surface-inverse hover:text-accent-ink-inverse active:bg-surface-inverse data-popup-open:bg-surface-inverse data-popup-open:text-accent-ink-inverse",
};

const pressedClass: Record<IconButtonVariant, string> = {
  plain: "bg-surface-muted text-ink active:bg-line",
  floating:
    "rounded-full bg-neutral-200 text-neutral-900 shadow-sm active:bg-neutral-300",
  accent: "bg-action text-on-action active:bg-action-pressed",
  inverse: "bg-surface-inverse text-accent-ink-inverse",
};

const disabledClass: Record<IconButtonVariant, string> = {
  plain: "cursor-not-allowed bg-surface-sunken text-ink-disabled",
  floating:
    "cursor-not-allowed rounded-full bg-neutral-50 text-neutral-400 shadow-sm",
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
        "transition-colors duration-(--duration-fast) ease-standard",
        focusRing,
        sizeClass[size],
        disabled
          ? disabledClass[variant]
          : pressed
            ? pressedClass[variant]
            : enabledClass[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
