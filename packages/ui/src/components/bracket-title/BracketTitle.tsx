import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type BracketTitleProps = Omit<ComponentProps<"h3">, "children"> & {
  /** 标题层级，默认 3（`<h3>`） */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** 名称 */
  children: ReactNode;
};

const bracket = "font-medium text-ink-tertiary";

/**
 * 方括号标题 `[ 名称 ]`：人物、地点、物品的名称——"一个被归档的条目"。
 * 普通的分节标题用 `SectionTitle`。字号用 `className` 改，默认是名称用的 `text-4xl`。
 */
export function BracketTitle({
  level = 3,
  className,
  children,
  ...props
}: BracketTitleProps) {
  const Heading: ElementType = `h${level}`;

  return (
    // 括号和名称排在同一行内而不是弹性盒里：名称换行时，右括号跟在最后一个字后面
    <Heading
      {...props}
      className={cn("text-4xl font-bold wrap-anywhere text-ink", className)}
    >
      <span aria-hidden="true" className={cn(bracket, "mr-[0.4em]")}>
        [
      </span>
      {children}
      <span aria-hidden="true" className={cn(bracket, "ml-[0.4em]")}>
        ]
      </span>
    </Heading>
  );
}
