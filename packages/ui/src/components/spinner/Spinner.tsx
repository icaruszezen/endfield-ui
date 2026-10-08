import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type SpinnerSize = "sm" | "md";

export type SpinnerProps = Omit<ComponentProps<"span">, "children"> & {
  /** 12px 或 16px。要别的尺寸用 `className` 给 `size-*` */
  size?: SpinnerSize;
  /**
   * 读屏听到的话，默认"加载中"。
   * 旁边已经有文字说明正在加载时传 `null`：这时它只是装饰，对读屏隐藏。
   */
  label?: ReactNode;
};

const sizeClass: Record<SpinnerSize, string> = {
  sm: "size-3",
  md: "size-4",
};

// 系统开启"减少动态效果"时停成一个 45° 的菱形，和列表里的菱形记号是同一个样子
const square =
  "animate-spin bg-current motion-reduce:rotate-45 motion-reduce:animate-none";

/**
 * 行内加载指示：一个匀速旋转的小方块，颜色继承文字。
 * 圆环形的用 `<ProgressRing size={16} />`；整块内容加载用 `Skeleton`。
 */
export function Spinner({
  size = "md",
  label = "加载中",
  className,
  ...props
}: SpinnerProps) {
  if (label === null) {
    return (
      <span
        {...props}
        aria-hidden="true"
        className={cn(
          "inline-block shrink-0 align-middle",
          square,
          sizeClass[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      {...props}
      role="status"
      className={cn(
        "inline-flex shrink-0 align-middle",
        sizeClass[size],
        className,
      )}
    >
      <span aria-hidden="true" className={cn("block size-full", square)} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
