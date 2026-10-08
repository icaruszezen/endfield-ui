import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type TagVariant =
  | "solid"
  | "outline"
  | "inverse"
  | "muted"
  | "accent"
  | "gain";
export type TagSize = "sm" | "md";

export type TagProps = ComponentProps<"span"> & {
  /**
   * 直角标签：归档性的、不变的信息。
   *
   * - `solid` 深灰底白字、2px 微圆角，媒体类型（`PV`、`OST`），默认；
   * - `outline` 白底细边，活动类型、分类；
   * - `inverse` 墨底白字，日期块、名值对里的"名"；
   * - `muted` 浅灰底墨字，名值对里的"值"；
   * - `accent` 黄底墨字，状态签（`NEW`、推荐）；
   * - `gain` 荧光黄绿底墨字，增益签（`+6%`）。
   */
  variant?: TagVariant;
  size?: TagSize;
  /** 等宽数字，用于日期、编号 */
  numeric?: boolean;
  /** 左上角加一个小红角，标出一组日期块里需要留意的那一个 */
  marked?: boolean;
};

const sizeClass: Record<TagSize, string> = {
  sm: "h-5 px-1.5 text-xs",
  md: "h-7 px-2.5 text-sm",
};

const variantClass: Record<TagVariant, string> = {
  solid: "rounded-xs bg-control text-on-control",
  outline: "border border-line-strong bg-surface text-ink",
  inverse: "bg-surface-inverse text-ink-inverse",
  muted: "bg-surface-sunken text-ink",
  accent: "bg-action text-on-action",
  // 有意不随主题翻转：增益色是按"填充 + 墨字"取的角色色
  gain: "bg-gain text-neutral-900",
};

export function Tag({
  variant = "solid",
  size = "md",
  numeric = false,
  marked = false,
  className,
  ...props
}: TagProps) {
  return (
    <span
      {...props}
      data-variant={variant}
      data-marked={marked ? "" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center font-medium leading-none whitespace-nowrap",
        sizeClass[size],
        variantClass[variant],
        numeric && "font-tech font-bold tabular-nums",
        marked &&
          "relative before:absolute before:top-0 before:left-0 before:size-1.5 before:bg-alert before:content-[''] before:[clip-path:polygon(0_0,100%_0,0_100%)]",
        className,
      )}
    />
  );
}
