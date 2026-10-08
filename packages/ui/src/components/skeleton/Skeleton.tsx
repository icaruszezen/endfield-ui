import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type SkeletonVariant = "block" | "text" | "circle";

export type SkeletonProps = Omit<ComponentProps<"span">, "children"> & {
  /**
   * - `block` 与内容等大的色块，尺寸用 `className` 给（`h-40 w-full`），默认；
   * - `text` 几行文字，行高跟随所在位置的字号；
   * - `circle` 圆形，头像、图标。
   */
  variant?: SkeletonVariant;
  /** `text` 的行数，默认 3。多于一行时末行短一截 */
  lines?: number;
  /** 很轻的明度往返。默认不动 */
  pulse?: boolean;
};

const fill = "block bg-surface-muted";

/**
 * 骨架：只画大块，不画细节。
 * 自身对辅助技术隐藏；"正在加载"由外层区域的 `aria-busy="true"` 表达。
 */
export function Skeleton({
  variant = "block",
  lines = 3,
  pulse = false,
  className,
  ...props
}: SkeletonProps) {
  const motion = pulse && "animate-pulse";

  if (variant === "text") {
    const count = Math.max(1, Math.floor(lines));
    return (
      <span
        {...props}
        aria-hidden="true"
        data-variant={variant}
        className={cn("flex flex-col gap-[0.6em]", motion, className)}
      >
        {Array.from({ length: count }, (_, index) => (
          <span
            key={index}
            className={cn(
              fill,
              "h-[0.9em]",
              count > 1 && index === count - 1 ? "w-3/5" : "w-full",
            )}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      {...props}
      aria-hidden="true"
      data-variant={variant}
      className={cn(
        fill,
        variant === "circle" ? "size-10 rounded-full" : "h-16 w-full",
        motion,
        className,
      )}
    />
  );
}
