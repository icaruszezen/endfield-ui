import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";

export type ListProps = ComponentProps<"ul">;

/** 列表行的容器：行间一条 1px 的线，外圈不描边。里面只放 `ListRow`。 */
export function List({ className, ...props }: ListProps) {
  return (
    <ul
      {...props}
      className={cn("divide-y divide-line text-ink", className)}
    />
  );
}

export type ListRowSize = "sm" | "md";

export type ListRowProps = Omit<ComponentProps<"li">, "onClick"> & {
  /** 行首：图标、日期块、缩略图 */
  start?: ReactNode;
  /** 行尾：数值或状态，右对齐、等宽 */
  end?: ReactNode;
  /** 标题下的一行次要说明 */
  description?: ReactNode;
  /** 选中：浅灰底 + 左缘黄条 + 标题加粗 */
  selected?: boolean;
  /** 40px 或 48px 行高 */
  size?: ListRowSize;
  /** 传了就整行渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  /** 传了（且没有 `href`）就整行渲染成按钮 */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
};

const sizeClass: Record<ListRowSize, string> = {
  sm: "min-h-10 py-2",
  md: "min-h-12 py-2.5",
};

/**
 * 一行一个条目。整行可点时只有一个可点击元素，不要在里面再嵌按钮。
 * 左缘的黄条只表示"选中"，不要拿它表示类目。
 */
export function ListRow({
  start,
  end,
  description,
  selected,
  size = "md",
  href,
  target,
  rel,
  onClick,
  disabled = false,
  className,
  children,
  ...props
}: ListRowProps) {
  const isLink = href !== undefined;
  const isButton = !isLink && onClick !== undefined;
  const interactive = (isLink || isButton) && !disabled;

  const rowClass = cn(
    "relative flex w-full items-center gap-3 px-4 text-left",
    sizeClass[size],
    selected &&
      "bg-surface-muted before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-action before:content-['']",
    interactive && [
      "transition-colors duration-(--duration-fast) ease-standard",
      !selected && "hover:bg-ink/5 active:bg-ink/10",
      focusRingInset,
    ],
    disabled && "cursor-not-allowed text-ink-disabled",
  );

  const content = (
    <>
      {start && <span className="flex shrink-0 items-center">{start}</span>}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate", selected && "font-bold")}>
          {children}
        </span>
        {description && (
          <span
            className={cn(
              "block truncate text-xs",
              disabled ? "text-ink-disabled" : "text-ink-secondary",
            )}
          >
            {description}
          </span>
        )}
      </span>
      {end && (
        <span
          className={cn(
            "flex shrink-0 items-center font-tech text-sm tabular-nums",
            disabled
              ? "text-ink-disabled"
              : selected
                ? "text-ink"
                : "text-ink-secondary",
          )}
        >
          {end}
        </span>
      )}
    </>
  );

  let row: ReactNode;
  if (isLink) {
    row = (
      <a
        // 禁用的链接去掉 href，保留 link 角色，让读屏仍能读出"不可用"
        href={disabled ? undefined : href}
        role={disabled ? "link" : undefined}
        aria-disabled={disabled || undefined}
        target={target}
        rel={rel}
        aria-current={selected ? "true" : undefined}
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        className={rowClass}
      >
        {content}
      </a>
    );
  } else if (isButton) {
    row = (
      <button
        type="button"
        disabled={disabled}
        // 只有声明了 selected 的行才是"可切换"的
        aria-pressed={selected}
        onClick={onClick}
        className={rowClass}
      >
        {content}
      </button>
    );
  } else {
    row = <div className={rowClass}>{content}</div>;
  }

  return (
    <li
      {...props}
      data-selected={selected ? "" : undefined}
      className={className}
    >
      {row}
    </li>
  );
}
