import type { ComponentProps, ReactNode } from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { ChevronLeft } from "../../icons/ChevronLeft";
import { ChevronRight } from "../../icons/ChevronRight";
import { cn } from "../../lib/cn";
import { IconButton, type IconButtonSize } from "../icon-button/IconButton";

export type NavigatorSize = "sm" | "md";

export type NavigatorProps = Omit<
  ComponentProps<"div">,
  "children" | "onChange"
> & {
  /** 各条目的名称，按顺序 */
  items: ReactNode[];
  /** 受控的当前条目，从 0 起 */
  index?: number;
  /** 非受控时的初始条目，默认 0 */
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** 首尾相接：到最后一项再往后回到第一项。默认到头时按钮禁用 */
  loop?: boolean;
  /** 40 或 56px 高 */
  size?: NavigatorSize;
  prevLabel?: string;
  nextLabel?: string;
  /** 读屏听到的当前位置，默认"第 1 项，共 4 项" */
  positionLabel?: (position: number, count: number) => string;
};

const boxSize: Record<NavigatorSize, string> = {
  sm: "h-10 gap-1 p-1 text-sm",
  md: "h-14 gap-2 p-2 text-base",
};

const buttonSize: Record<NavigatorSize, IconButtonSize> = {
  sm: "sm",
  md: "md",
};

const defaultPositionLabel = (position: number, count: number) =>
  `第 ${position} 项，共 ${count} 项`;

/**
 * 胶囊导航器：在少量条目间前后切换，并显示当前条目的名称。
 * 用 `aria-label` 说明翻的是什么（"勘探区"）。
 */
export function Navigator({
  items,
  index,
  defaultIndex = 0,
  onIndexChange,
  loop = false,
  size = "md",
  prevLabel = "上一项",
  nextLabel = "下一项",
  positionLabel = defaultPositionLabel,
  className,
  ...props
}: NavigatorProps) {
  const count = items.length;
  const [inner, setIndex] = useControllableState({
    value: index,
    defaultValue: defaultIndex,
    onChange: onIndexChange,
  });
  const current = Math.min(Math.max(inner, 0), Math.max(count - 1, 0));

  const go = (next: number) => {
    if (count === 0) return;
    setIndex(
      loop ? (next + count) % count : Math.min(Math.max(next, 0), count - 1),
    );
  };

  const single = count <= 1;

  return (
    <div
      role="group"
      {...props}
      data-size={size}
      className={cn(
        "inline-flex max-w-full items-center rounded-full bg-surface-muted text-ink",
        boxSize[size],
        className,
      )}
    >
      <IconButton
        variant="floating"
        size={buttonSize[size]}
        aria-label={prevLabel}
        disabled={single || (!loop && current === 0)}
        onClick={() => go(current - 1)}
      >
        <ChevronLeft />
      </IconButton>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-w-0 flex-1 items-baseline justify-center gap-2 px-2"
      >
        <span className="shrink-0 font-tech text-xs font-bold text-accent-ink tabular-nums">
          <span aria-hidden="true">{`${count === 0 ? 0 : current + 1}/${count}`}</span>
          <span className="sr-only">{positionLabel(current + 1, count)}</span>
        </span>
        {/* 所有名称叠在同一格里，按最宽的定宽：翻动时两端的按钮不跑位 */}
        <span className="grid min-w-0">
          {items.map((item, position) => (
            <span
              key={position}
              data-current={position === current ? "" : undefined}
              className={cn(
                "col-start-1 row-start-1 truncate text-center",
                position !== current && "invisible",
              )}
            >
              {item}
            </span>
          ))}
        </span>
      </div>

      <IconButton
        variant="floating"
        size={buttonSize[size]}
        aria-label={nextLabel}
        disabled={single || (!loop && current === count - 1)}
        onClick={() => go(current + 1)}
      >
        <ChevronRight />
      </IconButton>
    </div>
  );
}
