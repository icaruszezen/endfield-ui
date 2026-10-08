import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type BadgeProps = Omit<ComponentProps<"span">, "children"> & {
  /** 数量。显示为橙色数字块 */
  count?: number;
  /** 超过后显示为 `max+`，默认 99 */
  max?: number;
  /** `count` 为 0 时是否仍然显示，默认不显示 */
  showZero?: boolean;
  /** 不带数字的提醒：一个橙色菱形 */
  dot?: boolean;
  /** 给读屏的完整说明，如"12 条未读"。提供后角标本身对辅助技术隐藏 */
  label?: string;
  /** 被标记的元素。角标压在它的右上角，向外偏移半个自身 */
  children?: ReactNode;
};

/** 通知角标：提醒与数量归橙色，不用来表示危险。 */
export function Badge({
  count,
  max = 99,
  showZero = false,
  dot = false,
  label,
  className,
  children,
  ...props
}: BadgeProps) {
  let indicator: ReactNode = null;
  if (dot) {
    indicator = (
      <span
        aria-hidden="true"
        className="block size-2 rotate-45 bg-notice"
        data-badge="dot"
      />
    );
  } else if (count !== undefined && (count > 0 || showZero)) {
    indicator = (
      <span
        aria-hidden={label ? "true" : undefined}
        className="inline-flex h-4.5 min-w-4.5 items-center justify-center bg-notice px-1 font-tech text-xs leading-none font-bold text-neutral-900 tabular-nums"
        data-badge="count"
      >
        {count > max ? `${max}+` : count}
      </span>
    );
  }

  const visible = indicator !== null;
  const description =
    visible && label ? <span className="sr-only">{label}</span> : null;

  if (children === undefined) {
    return (
      <span {...props} className={cn("inline-flex items-center", className)}>
        {indicator}
        {description}
      </span>
    );
  }

  return (
    <span {...props} className={cn("relative inline-flex", className)}>
      {children}
      {visible && (
        <span className="pointer-events-none absolute top-0 right-0 translate-x-1/2 -translate-y-1/2">
          {indicator}
          {description}
        </span>
      )}
    </span>
  );
}
