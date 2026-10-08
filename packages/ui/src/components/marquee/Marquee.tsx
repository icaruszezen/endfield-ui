import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type MarqueeProps = ComponentProps<"div"> & {
  /** 走完一程的秒数，默认 20。内容越长给得越大 */
  duration?: number;
  /** 首尾两份内容之间的间隔，任意 CSS 长度，默认 `2rem` */
  gap?: string;
  /** 鼠标悬停或焦点落到里面时暂停，默认开 */
  pauseOnHover?: boolean;
  /** 由使用方控制的暂停 */
  paused?: boolean;
  /** 只在内容放不下时才动；放得下就是一行普通的文字 */
  overflowOnly?: boolean;
};

/**
 * 跑马灯：内容复制一份首尾相接，匀速走到一半后停顿一下再循环。
 * 用在巨字和过长的单行文字上；系统开启"减少动态效果"时静止在起点。
 * 纯装饰的巨字给它加 `aria-hidden`。
 */
export function Marquee({
  duration = 20,
  gap = "2rem",
  pauseOnHover = true,
  paused = false,
  overflowOnly = false,
  className,
  children,
  ...props
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  // 量出来之前先当它放得下：先静止、再动起来，比先动一下再停住自然
  const [fits, setFits] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    const copy = copyRef.current;
    if (!overflowOnly || !root || !copy) return;

    const measure = () => {
      setFits(copy.getBoundingClientRect().width <= root.clientWidth);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [overflowOnly]);

  const moving = !(overflowOnly && fits);
  // 间隔用外边距：它不算进一份内容自己的宽度，量"放不放得下"时不用再扣掉
  const copyStyle = moving ? { marginRight: gap } : undefined;

  return (
    <div
      ref={rootRef}
      {...props}
      data-moving={moving ? "" : undefined}
      className={cn("group/marquee flex overflow-hidden", className)}
    >
      <div
        className={cn(
          "flex w-max shrink-0",
          moving && "animate-marquee motion-reduce:animate-none",
          moving &&
            pauseOnHover &&
            "group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]",
          paused && "[animation-play-state:paused]",
        )}
        style={moving ? { animationDuration: `${duration}s` } : undefined}
      >
        <div
          ref={copyRef}
          className="flex shrink-0 items-center"
          style={copyStyle}
        >
          {children}
        </div>
        {moving && (
          // 副本只为首尾相接：对读屏隐藏、不可聚焦，减少动态效果时不显示
          <div
            aria-hidden="true"
            inert
            className="flex shrink-0 items-center motion-reduce:hidden"
            style={copyStyle}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
