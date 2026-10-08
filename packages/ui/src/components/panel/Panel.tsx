import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type PanelProps = ComponentProps<"div"> & {
  /** 1px 描边，默认有。关掉后只靠底色差分层 */
  bordered?: boolean;
};

/** 围住一组信息的容器：直角、底色只比页面差一档、没有阴影。不要面板套面板。 */
export function Panel({ bordered = true, className, ...props }: PanelProps) {
  return (
    <div
      {...props}
      className={cn(
        "bg-surface-raised text-ink",
        bordered && "border border-line",
        className,
      )}
    />
  );
}

export type PanelHeaderVariant = "band" | "line";

export type PanelHeaderProps = Omit<ComponentProps<"div">, "title"> & {
  /**
   * - `band` 深色横带 + 左端短竖条，默认；
   * - `line` 只有一条细线和小标题，更轻。同一个界面选一种。
   */
  variant?: PanelHeaderVariant;
  /** 标题右侧的计数或一个小操作 */
  extra?: ReactNode;
  /** 标题层级，默认 3（`<h3>`） */
  level?: 2 | 3 | 4 | 5 | 6;
};

export function PanelHeader({
  variant = "band",
  extra,
  level = 3,
  className,
  children,
  ...props
}: PanelHeaderProps) {
  const Heading: ElementType = `h${level}`;

  return (
    <div
      {...props}
      className={cn(
        "relative flex items-center justify-between gap-3 px-4 text-sm font-medium",
        variant === "band"
          ? "min-h-8 bg-surface-inverse text-ink-inverse"
          : "min-h-10 border-b border-line text-ink",
        className,
      )}
    >
      {variant === "band" && (
        // 标题带是反转块，竖条用反转块上的强调色才能在暗色主题下看得见
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 h-4 w-1 -translate-y-1/2 bg-accent-ink-inverse"
        />
      )}
      <Heading className="min-w-0 truncate">{children}</Heading>
      {extra && <div className="flex shrink-0 items-center gap-2">{extra}</div>}
    </div>
  );
}

export type PanelBodyProps = ComponentProps<"div">;

export function PanelBody({ className, ...props }: PanelBodyProps) {
  return <div {...props} className={cn("p-4", className)} />;
}

export type PanelRowsProps = ComponentProps<"dl">;

/** 属性行的容器。里面只放 `PanelRow`。 */
export function PanelRows({ className, ...props }: PanelRowsProps) {
  return <dl {...props} className={cn("px-4", className)} />;
}

export type PanelRowProps = Omit<ComponentProps<"div">, "children"> & {
  /** 属性名，左对齐 */
  label: ReactNode;
  /** 属性值，右对齐、等宽、加粗 */
  children: ReactNode;
};

export function PanelRow({
  label,
  children,
  className,
  ...props
}: PanelRowProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0",
        className,
      )}
    >
      <dt className="text-sm text-ink-secondary">{label}</dt>
      <dd className="text-right font-tech text-sm font-bold text-ink tabular-nums">
        {children}
      </dd>
    </div>
  );
}
