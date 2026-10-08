import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type ButtonGroupAlign = "start" | "end" | "between";
export type ButtonGroupOrientation = "horizontal" | "vertical";
export type ButtonGroupGap = "sm" | "md";

export type ButtonGroupProps = ComponentProps<"div"> & {
  /** 横排时靠哪一边。默认 `end`：主要行动放在最右 */
  align?: ButtonGroupAlign;
  /** 竖排时按钮等宽，主要行动放在最下 */
  orientation?: ButtonGroupOrientation;
  /** 按钮之间 8px 或 12px */
  gap?: ButtonGroupGap;
};

const alignClass: Record<ButtonGroupAlign, string> = {
  start: "justify-start",
  end: "justify-end",
  between: "justify-between",
};

const gapClass: Record<ButtonGroupGap, string> = {
  sm: "gap-2",
  md: "gap-3",
};

/**
 * 并排的一组按钮。主要行动写在最后（最右或最下），一组里最多一个 `action`；
 * "取消 + 确认"用 `light` + `control`，把黄色留给真正重要的时刻。
 * 放不下时整组换行，不挤压按钮。
 */
export function ButtonGroup({
  align = "end",
  orientation = "horizontal",
  gap = "md",
  className,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      {...props}
      data-orientation={orientation}
      className={cn(
        "flex",
        gapClass[gap],
        orientation === "vertical"
          ? "flex-col items-stretch"
          : ["flex-wrap items-center", alignClass[align]],
        className,
      )}
    />
  );
}
