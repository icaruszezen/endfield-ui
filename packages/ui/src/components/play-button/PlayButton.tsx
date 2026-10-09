import type { ComponentProps } from "react";
import { TriangleRight } from "../../icons/TriangleRight";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";

export type PlayMarkSize = "sm" | "md" | "lg";

/* 24 / 32 / 40px，三角占一半 */
const boxSize: Record<PlayMarkSize, string> = {
  sm: "size-6 [&_svg]:size-3",
  md: "size-8 [&_svg]:size-4",
  lg: "size-10 [&_svg]:size-5",
};

/*
 * 黄色小方块 + 墨色三角。有意不随主题变：它压在图上。
 * 黄色压在浅色的图上边界不清楚，认它靠的是里面的三角。
 */
const markBase =
  "inline-flex shrink-0 items-center justify-center rounded-xs bg-action text-on-action";

export type PlayMarkProps = Omit<ComponentProps<"span">, "children"> & {
  size?: PlayMarkSize;
};

/**
 * 播放记号：只是一个记号，不能点，对读屏隐藏。
 * 整张卡已经是一个链接时用它（媒体卡的 `video`）；要它自己能点用 `PlayButton`。
 */
export function PlayMark({ size = "md", className, ...props }: PlayMarkProps) {
  return (
    <span
      aria-hidden="true"
      {...props}
      data-size={size}
      className={cn(markBase, boxSize[size], className)}
    >
      <TriangleRight />
    </span>
  );
}

export type PlayButtonProps = Omit<
  ComponentProps<"button">,
  "children" | "aria-label"
> & {
  /** 默认"播放"。一页有好几个时写明播的是什么 */
  "aria-label"?: string;
  size?: PlayMarkSize;
};

/** 播放钮：和播放记号同一个画法的按钮，给"点了就在原地播放"的封面用。 */
export function PlayButton({
  "aria-label": ariaLabel = "播放",
  size = "md",
  type = "button",
  disabled = false,
  className,
  ...props
}: PlayButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      data-size={size}
      className={cn(
        "group relative",
        markBase,
        boxSize[size],
        "transition-colors duration-(--duration-fast) ease-standard",
        focusRing,
        // 24px 小于触屏的最小点击区，用伪元素向外补到 40px
        size === "sm" && "after:absolute after:-inset-2 after:content-['']",
        disabled
          ? "cursor-not-allowed bg-disabled text-on-disabled"
          : "active:bg-action-pressed",
        className,
      )}
    >
      {/* 悬停：记号让一步，和按钮的竖条变箭头是同一种做法 */}
      <TriangleRight
        className={cn(
          "transition-[translate] duration-(--duration-base) ease-standard",
          !disabled &&
            "group-hover:translate-x-0.5 group-active:translate-x-0.5",
        )}
      />
    </button>
  );
}
