import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type TimelineProps = ComponentProps<"ol">;

/** 竖向时间线的容器，里面只放 `TimelineItem`，按时间顺序排。 */
export function Timeline({ className, ...props }: TimelineProps) {
  return <ol {...props} className={cn("text-ink", className)} />;
}

export type TimelineStatus = "past" | "current" | "upcoming";

export type TimelineItemProps = Omit<ComponentProps<"li">, "title"> & {
  /**
   * - `past` 已过：实心菱形，默认；
   * - `current` 当前：黄色菱形，标题加粗；
   * - `upcoming` 未到：空心菱形，文字降为次级色。
   */
  status?: TimelineStatus;
  /** 节点旁的日期或时间，等宽小字 */
  date?: ReactNode;
  title: ReactNode;
  /** 标题下的说明 */
  children?: ReactNode;
};

const nodeClass: Record<TimelineStatus, string> = {
  past: "bg-ink",
  // 描一圈最细的线（1px），颜色跟着文字走：亮色下是墨色，暗色下是近白
  current: "border border-ink bg-action",
  upcoming: "border-2 border-ink-tertiary",
};

const titleClass: Record<TimelineStatus, string> = {
  past: "text-ink",
  current: "font-bold text-ink",
  upcoming: "text-ink-secondary",
};

export function TimelineItem({
  status = "past",
  date,
  title,
  className,
  children,
  ...props
}: TimelineItemProps) {
  const hasDate = date !== undefined && date !== null && date !== false;

  return (
    <li
      {...props}
      data-status={status}
      aria-current={status === "current" ? "step" : undefined}
      className={cn("group/item flex gap-3", className)}
    >
      {/* 字号跟第一行文字走，节点才能对齐它 */}
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 flex-col items-center",
          hasDate ? "text-xs" : "text-base",
        )}
      >
        <span className="flex h-[1lh] min-h-4 w-4 items-center justify-center">
          <span className={cn("size-[11px] rotate-45", nodeClass[status])} />
        </span>
        {/* 轴只画在节点之间，不从节点后面穿过，空心菱形才是空的 */}
        <span className="w-0.5 flex-1 bg-line-strong group-last/item:hidden" />
      </span>
      <div className="min-w-0 flex-1 pb-6 group-last/item:pb-0">
        {hasDate && (
          <div className="font-tech text-xs text-ink-secondary tabular-nums">
            {date}
          </div>
        )}
        <div className={cn("wrap-anywhere", titleClass[status])}>{title}</div>
        {children !== undefined && (
          <div className="mt-1 text-sm text-ink-secondary">{children}</div>
        )}
      </div>
    </li>
  );
}
