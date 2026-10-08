import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type ProgressSize = "sm" | "md";

export type ProgressProps = Omit<ComponentProps<"div">, "children"> & {
  /** 当前值。不传就是"不确定进度"：一段色块在轨道上往返 */
  value?: number;
  /** 最大值，默认 100；分段进度下默认等于段数 */
  max?: number;
  /** 步骤数明确时把轨道切成等长的小段，`value` 是已完成的段数 */
  segments?: number;
  /** 4px 细条或 8px 标准条 */
  size?: ProgressSize;
  /** 在右侧显示数值：百分比，分段时是 `3 / 6` */
  showValue?: boolean;
  /** 自定义数值的写法 */
  formatValue?: (value: number, max: number) => ReactNode;
  /** 入场时从左侧充填一次 */
  animate?: boolean;
};

const trackSize: Record<ProgressSize, string> = {
  sm: "h-1",
  md: "h-2",
};

/*
 * 黄色填充压在亮色的浅灰轨道上只有 1.3:1，所以四周加 1px 的 on-action 描边。
 * 描边画在轨道之外（outline），不吃掉填充的高度；它在暗色轨道上几乎看不见，
 * 因此不需要按主题分支。
 */
const fillClass = "bg-action outline-1 outline-on-action";

/**
 * 进度：灰轨 + 黄填充。表示"完成了多少"；表示"数量有多少"用图表，那是蓝色的事。
 *
 * `className` 给外层，其余属性（`aria-label` 等）给带 `role="progressbar"` 的轨道。
 */
export function Progress({
  value,
  max,
  segments,
  size = "md",
  showValue = false,
  formatValue,
  animate = false,
  className,
  style,
  ...props
}: ProgressProps) {
  const segmented = segments !== undefined && segments > 0;
  const total = max ?? (segmented ? segments : 100);
  const indeterminate = value === undefined;
  const current = indeterminate ? 0 : Math.min(Math.max(value, 0), total);
  const ratio = total > 0 ? current / total : 0;

  let bar: ReactNode;
  if (segmented) {
    const done = Math.round(ratio * segments);
    bar = (
      <span className="flex h-full gap-1">
        {Array.from({ length: segments }, (_, index) => (
          <span
            key={index}
            data-done={index < done ? "" : undefined}
            className={cn("flex-1", index < done ? fillClass : "bg-line")}
          />
        ))}
      </span>
    );
  } else if (indeterminate) {
    bar = (
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-2/5 animate-indeterminate",
          // 减少动态效果时停在正中，不会被看成"进度 40%"
          "motion-reduce:translate-x-3/4",
          fillClass,
        )}
      />
    );
  } else if (ratio > 0) {
    bar = (
      <span
        className={cn(
          "absolute inset-y-0 left-0 transition-[width] duration-(--duration-base) ease-standard",
          animate && "origin-left animate-fill",
          fillClass,
        )}
        style={{ width: `${ratio * 100}%` }}
      />
    );
  }

  let text: ReactNode = null;
  if (showValue && !indeterminate) {
    if (formatValue) text = formatValue(current, total);
    else if (segmented) text = `${current} / ${total}`;
    else text = `${Math.round(ratio * 100)}%`;
  }

  return (
    <div
      className={cn("flex items-center gap-3 text-ink", className)}
      style={style}
      data-size={size}
    >
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={indeterminate ? undefined : current}
        aria-valuetext={
          segmented && !indeterminate ? `${current} / ${total}` : undefined
        }
        {...props}
        className={cn(
          "relative min-w-0 flex-1",
          trackSize[size],
          !segmented && "bg-line",
        )}
      >
        {bar}
      </div>
      {text !== null && (
        // 留出"100%"的宽度：几条并排时数值位数不同，轨道也能对齐
        <span className="min-w-[4ch] shrink-0 text-right font-tech text-sm leading-none font-bold tabular-nums">
          {text}
        </span>
      )}
    </div>
  );
}
