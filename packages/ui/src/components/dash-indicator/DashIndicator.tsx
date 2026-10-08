import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type DashIndicatorProps = Omit<ComponentProps<"span">, "children"> & {
  /** 一共几项 */
  count: number;
  /** 当前是第几项，从 0 起 */
  index: number;
};

/**
 * 进度短横：一排短横线表示"共几项、在第几项"。只做指示，不可点击；
 * 要能翻动，旁边配一个 `Navigator` 或一对翻页钮。
 */
export function DashIndicator({
  count,
  index,
  className,
  ...props
}: DashIndicatorProps) {
  const total = Math.max(0, Math.floor(count));
  const current = Math.min(Math.max(Math.floor(index), 0), total - 1);

  return (
    <span
      role="img"
      aria-label={`第 ${current + 1} 项，共 ${total} 项`}
      {...props}
      className={cn("inline-flex items-center gap-1", className)}
    >
      {Array.from({ length: total }, (_, position) => (
        <span
          key={position}
          data-current={position === current ? "" : undefined}
          className={cn(
            "h-0.5 transition-[width,background-color] duration-(--duration-base) ease-standard",
            // 当前一根除了换色还加长一倍，不只靠颜色
            position === current ? "w-8 bg-accent-ink" : "w-4 bg-line-strong",
          )}
        />
      ))}
    </span>
  );
}
