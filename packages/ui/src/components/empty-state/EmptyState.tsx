import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  /** 一句话说明现状："暂无记录" */
  title: ReactNode;
  /** 一句话说明原因或下一步 */
  description?: ReactNode;
  /** 可选的一个行动，通常是一个 `control` 按钮 */
  action?: ReactNode;
  /** 图形。默认是取景角 + 准星；传 `null` 去掉 */
  icon?: ReactNode;
  /** 虚线描边，默认有 */
  bordered?: boolean;
  /** 标题层级，默认 3（`<h3>`） */
  level?: 2 | 3 | 4 | 5 | 6;
};

/** 取景角 + 准星：游戏内图鉴用它表示"未获得"，空状态沿用这个符号 */
function Viewfinder() {
  return (
    <svg
      width={56}
      height={56}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 14V4h10M34 4h10v10M44 34v10H34M14 44H4V34" />
      <path d="M24 18v12M18 24h12" />
    </svg>
  );
}

/** 没有内容时的占位。说清楚为什么为空、接下来能做什么；不要用大幅插画填满。 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  bordered = true,
  level = 3,
  className,
  children,
  ...props
}: EmptyStateProps) {
  const Heading: ElementType = `h${level}`;
  const graphic = icon === undefined ? <Viewfinder /> : icon;

  return (
    <div
      {...props}
      className={cn(
        "flex flex-col items-center px-6 py-10 text-center text-ink",
        bordered && "border border-dashed border-line-strong",
        className,
      )}
    >
      {graphic !== null && (
        <div aria-hidden="true" className="mb-4 text-ink-tertiary">
          {graphic}
        </div>
      )}
      <Heading className="text-base font-medium">{title}</Heading>
      {description && (
        <p className="mt-1 max-w-[40ch] text-sm text-ink-secondary">
          {description}
        </p>
      )}
      {children}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
