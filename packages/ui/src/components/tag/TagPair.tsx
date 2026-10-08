import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Tag, type TagSize } from "./Tag";

export type TagPairProps = Omit<ComponentProps<"span">, "children"> & {
  /** 属性名，如"阵营" */
  name: ReactNode;
  /** 属性值 */
  value: ReactNode;
  /** 一组里需要突出的那一项："名"换成黄底 */
  emphasis?: boolean;
  size?: TagSize;
};

/** 名值对：两半紧贴，中间没有缝也没有分隔线。多组之间由使用方留 8px。 */
export function TagPair({
  name,
  value,
  emphasis = false,
  size = "md",
  className,
  ...props
}: TagPairProps) {
  return (
    <span {...props} className={cn("inline-flex shrink-0", className)}>
      <Tag variant={emphasis ? "accent" : "inverse"} size={size}>
        {name}
      </Tag>
      <Tag variant="muted" size={size}>
        {value}
      </Tag>
    </span>
  );
}
