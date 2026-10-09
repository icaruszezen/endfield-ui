import {
  useCallback,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import {
  useScrollPosition,
  type ScrollMetrics,
} from "../../hooks/useScrollPosition";
import { ChevronDown } from "../../icons/ChevronDown";
import { cn } from "../../lib/cn";

export type ScrollHintVariant = "line" | "chevron";

export type ScrollHintProps = Omit<ComponentProps<"div">, "children"> & {
  /** 上方的小字，默认 `SCROLL` */
  label?: ReactNode;
  /**
   * - `line` 一条细竖线 + 一个下坠的光点，默认；
   * - `chevron` 一个下坠的折线箭头，窄屏用。
   */
  variant?: ScrollHintVariant;
  /** 看哪个滚动容器。不传就是整个页面 */
  target?: RefObject<HTMLElement | null>;
  /** 滚过多少像素算"已经开始滚动"，默认 8 */
  threshold?: number;
};

/**
 * 滚动提示：只在确实还能往下滚、并且还没开始滚的时候出现，滚动开始后淡出。
 * 纯装饰，对读屏隐藏；位置由使用方定（首屏底部居中或右下）。
 */
export function ScrollHint({
  label = "SCROLL",
  variant = "line",
  target,
  threshold = 8,
  className,
  ...props
}: ScrollHintProps) {
  // 确实还能往下滚，并且还没开始滚。指定了容器但它还没挂上时不显示
  const stillAtTop = useCallback(
    ({ scrolled, room }: ScrollMetrics) =>
      room > threshold && scrolled <= threshold,
    [threshold],
  );
  const visible = useScrollPosition(target, stillAtTop, false);

  return (
    <div
      aria-hidden="true"
      {...props}
      data-visible={visible ? "" : undefined}
      className={cn(
        "pointer-events-none inline-flex flex-col items-center gap-2 text-ink-secondary",
        "transition-opacity duration-(--duration-base) ease-standard",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <span className="font-tech text-micro tracking-label uppercase">
        {label}
      </span>
      {variant === "line" ? (
        <span className="relative h-10 w-px bg-line-strong">
          {/* 光点骑在线上：6px 的点对 1px 的线，向左偏 2.5px */}
          <span className="absolute top-0 -left-[2.5px] size-1.5 animate-scroll-hint rounded-full bg-accent-ink" />
        </span>
      ) : (
        <ChevronDown
          size={16}
          className="animate-scroll-hint text-accent-ink"
        />
      )}
    </div>
  );
}
