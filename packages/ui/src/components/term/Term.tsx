import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type TermTone = "accent" | "info" | "success" | "warning" | "danger";

export type TermProps = ComponentProps<"strong"> & {
  /**
   * 颜色代表的含义。同一个产品里"颜色 → 含义"的对应必须唯一，并写成一张表。
   * 默认 `accent`：数值与一般的强调。
   */
  tone?: TermTone;
  /** 词前的小图标，跟着文字的大小与颜色走 */
  icon?: ReactNode;
};

/* 文字档的语义色，已经按主题切好；不要直接用填充色 */
const toneClass: Record<TermTone, string> = {
  accent: "text-accent-ink",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/**
 * 正文里着色的机制词（技能、属性、数值）。着色的同时加粗，不只靠颜色。
 * 用在页面表面上；反转块上这些颜色不够亮，不要用。
 */
export function Term({
  tone = "accent",
  icon,
  className,
  children,
  ...props
}: TermProps) {
  return (
    <strong
      {...props}
      data-tone={tone}
      className={cn("font-bold", toneClass[tone], className)}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="mr-[0.2em] inline-flex align-[-0.125em] [&_svg]:size-[1em]"
        >
          {icon}
        </span>
      )}
      {children}
    </strong>
  );
}
