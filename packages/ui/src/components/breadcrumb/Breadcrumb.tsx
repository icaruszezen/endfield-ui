import {
  Children,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";

export type BreadcrumbProps = ComponentProps<"nav"> & {
  /**
   * 最多显示几项。超出时保留首项和靠后的几项，中间折叠成 `…`，点击展开。
   * 不传则全部显示。
   */
  maxItems?: number;
  /** 折叠按钮的可访问名称 */
  expandLabel?: string;
};

function Separator() {
  return (
    <span
      aria-hidden="true"
      className="text-ink-tertiary [li:first-child>&]:hidden"
    >
      /
    </span>
  );
}

/** 层级路径：`// 档案 / 干员 / 详情`。双斜杠起头，单斜杠分隔。 */
export function Breadcrumb({
  maxItems,
  expandLabel = "显示完整路径",
  "aria-label": ariaLabel = "面包屑",
  className,
  children,
  ...props
}: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const justExpanded = useRef(false);

  const items = Children.toArray(children);
  const collapsed =
    maxItems !== undefined &&
    maxItems >= 2 &&
    items.length > maxItems &&
    !expanded;

  // 展开后折叠按钮消失，把焦点交给第一个刚露出来的链接，键盘用户不会掉回页面开头
  useEffect(() => {
    if (!justExpanded.current) return;
    justExpanded.current = false;
    listRef.current
      ?.querySelector<HTMLElement>("li:nth-child(2) a, li:nth-child(2) button")
      ?.focus();
  }, [expanded]);

  let visible: ReactNode[] = items;
  if (collapsed) {
    visible = [
      items[0],
      <li key="ellipsis" className="flex items-center gap-2">
        <Separator />
        <button
          type="button"
          aria-label={expandLabel}
          aria-expanded={false}
          onClick={() => {
            justExpanded.current = true;
            setExpanded(true);
          }}
          className={cn(
            "px-1 text-ink-secondary hover:text-ink",
            "transition-colors duration-(--duration-fast) ease-standard",
            focusRing,
          )}
        >
          …
        </button>
      </li>,
      ...items.slice(items.length - (maxItems - 1)),
    ];
  }

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={cn("flex items-baseline gap-2 text-sm", className)}
    >
      <span aria-hidden="true" className="shrink-0 text-ink-tertiary">
        {"//"}
      </span>
      <ol
        ref={listRef}
        className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1"
      >
        {visible}
      </ol>
    </nav>
  );
}

export type BreadcrumbItemProps = Omit<ComponentProps<"li">, "children"> & {
  /** 传了就渲染成链接。用路由库的链接组件时不传，把它放进 children */
  href?: string;
  /** 当前页：加粗、不可点击，输出 `aria-current="page"`。给最后一项 */
  current?: boolean;
  children: ReactNode;
};

export function BreadcrumbItem({
  href,
  current = false,
  className,
  children,
  ...props
}: BreadcrumbItemProps) {
  let content: ReactNode;
  if (current) {
    content = (
      <span aria-current="page" className="font-bold text-ink">
        {children}
      </span>
    );
  } else if (href !== undefined) {
    content = (
      <a
        href={href}
        className={cn(
          "text-ink-secondary underline-offset-4 hover:text-ink hover:underline",
          "transition-colors duration-(--duration-fast) ease-standard",
          focusRing,
        )}
      >
        {children}
      </a>
    );
  } else {
    content = <span className="text-ink-secondary">{children}</span>;
  }

  return (
    <li
      {...props}
      className={cn("flex min-w-0 items-baseline gap-2", className)}
    >
      <Separator />
      {content}
    </li>
  );
}
