import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type CornerBracketsSize = "sm" | "md";

export type CornerBracketsProps = ComponentProps<"div"> & {
  /** 要不要画括号，默认画。用作选中态时把选中状态传进来 */
  visible?: boolean;
  /** 臂长 12px 或 16px */
  size?: CornerBracketsSize;
};

const sizeClass: Record<CornerBracketsSize, string> = {
  sm: "[--bracket-arm:12px]",
  md: "[--bracket-arm:16px]",
};

/**
 * 角括号：四角各一个 L 形短线，把里面的东西框出来。
 * 用于矩阵里的单选（物品格、名册卡、图鉴）；列表行用左缘色条，页签用底色，都不用它。
 *
 * 括号画在盒子之外 4px：它所在的容器不能贴着盒子裁切。
 * 括号只是给眼睛看的，选中态另外要有 `aria-selected` / `aria-pressed`。
 */
export function CornerBrackets({
  visible = true,
  size = "sm",
  className,
  ...props
}: CornerBracketsProps) {
  return (
    <div
      {...props}
      data-visible={visible ? "" : undefined}
      className={cn(
        "relative",
        visible && "corner-brackets",
        sizeClass[size],
        className,
      )}
    />
  );
}
