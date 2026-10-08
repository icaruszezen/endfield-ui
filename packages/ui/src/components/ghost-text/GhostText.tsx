import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";

export type GhostTextVariant = "hatch" | "outline" | "solid";

export type GhostTextProps = ComponentProps<"span"> & {
  /**
   * - `hatch` 字形透明，用细斜纹填充。版块分隔、背景，默认；
   * - `outline` 字形透明，只有一圈浅色描边。章节编号、完成态的庆祝词；
   * - `solid` 纯墨色，越过容器边界被截断。
   */
  variant?: GhostTextVariant;
};

const variantClass: Record<GhostTextVariant, string> = {
  hatch: "ghost-hatch",
  outline: "ghost-outline",
  solid: "text-ink",
};

/**
 * 镂空巨字：版面背景层里的一个词或一个编号，不是标题。
 * 它只管长相与隐藏：放在哪、被谁裁切由使用方定——通常是绝对定位在一个
 * `relative overflow-clip` 的版块里。字号默认是 `text-ghost`，用 `className` 换。
 *
 * 内容要短，写与版块相关的真实词语；一个版块一个；窄屏上往往直接去掉更好。
 */
export function GhostText({
  variant = "hatch",
  className,
  ...props
}: GhostTextProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      data-variant={variant}
      className={cn(
        decor,
        "block font-display text-ghost font-extrabold whitespace-nowrap uppercase",
        variantClass[variant],
        className,
      )}
    />
  );
}
