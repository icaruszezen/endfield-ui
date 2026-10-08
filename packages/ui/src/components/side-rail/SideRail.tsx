import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";
import { NavActionContext } from "../nav-action/NavAction";

const SideRailContext = createContext({ collapsed: false });

export type SideRailProps = Omit<ComponentProps<"nav">, "aria-label"> & {
  /** 这块导航的名称，比如"主导航" */
  "aria-label": string;
  /**
   * 收起成只有图标的窄轨（64px）。默认是展开的（224px，图标 + 文字）。
   * 栏目少且固定、屏幕空间紧张时才收起
   */
  collapsed?: boolean;
  /** 最上面的标志。本库不带标志，传你自己的 */
  brand?: ReactNode;
  /** 导航项下面的工具组：几个图标按钮 */
  tools?: ReactNode;
  /** 主行动块：放一个 `NavAction` */
  action?: ReactNode;
  /** 最下面的次要入口 */
  footer?: ReactNode;
  /** `SideRailItem`、`SideRailGroup` */
  children: ReactNode;
};

/**
 * 侧轨：桌面端贴在左边的主导航。自上而下是标志、导航项、工具组、主行动块、次要入口；
 * 导航项放不下时在中间那一段里滚动。
 *
 * 默认 `sticky`、占满视口高；窄屏上不要把它缩小，换成 `TopBar` + `NavMenu`。
 */
export function SideRail({
  collapsed = false,
  brand,
  tools,
  action,
  footer,
  className,
  children,
  ...props
}: SideRailProps) {
  const context = useMemo(() => ({ collapsed }), [collapsed]);

  return (
    <SideRailContext value={context}>
      <nav
        {...props}
        data-collapsed={collapsed ? "" : undefined}
        className={cn(
          // 环境阴影在暗色页面上看不出来，所以另有一条边线
          "sticky top-0 z-(--z-nav) flex h-dvh shrink-0 flex-col border-r border-line bg-surface text-ink shadow-rail",
          "transition-[width] duration-(--duration-base) ease-standard",
          collapsed ? "w-16" : "w-56",
          className,
        )}
      >
        {brand && (
          <div
            className={cn(
              "flex h-16 shrink-0 items-center overflow-hidden",
              collapsed ? "justify-center" : "px-5",
            )}
          >
            {brand}
          </div>
        )}

        <ul className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain py-2">
          {children}
        </ul>

        {tools && (
          <div
            className={cn(
              "flex shrink-0 gap-1 p-3",
              collapsed ? "flex-col items-center" : "flex-wrap",
            )}
          >
            {tools}
          </div>
        )}

        {action && (
          <div
            className={cn("flex shrink-0 p-3", collapsed && "justify-center")}
          >
            <NavActionContext value={collapsed ? "stacked" : "block"}>
              {action}
            </NavActionContext>
          </div>
        )}

        {footer && (
          <div
            className={cn(
              "flex shrink-0 flex-col gap-1 border-t border-line p-3 text-xs text-ink-secondary",
              collapsed && "items-center",
            )}
          >
            {footer}
          </div>
        )}
      </nav>
    </SideRailContext>
  );
}

type ItemOwnProps = {
  /** 图标。收起时只剩它，所以每一项都要有 */
  icon: ReactNode;
  /** 当前所在的栏目：墨色 + 左缘一条短竖条，输出 `aria-current="page"` */
  current?: boolean;
  /** 行尾的补充：计数、角标。收起时不显示 */
  end?: ReactNode;
  disabled?: boolean;
  /** 传了就渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替 `<a>`（路由库的链接组件）。传了就按链接处理 */
  render?: LinkRender;
  /** 没有 `href` 和 `render` 时渲染成按钮 */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** 栏目的名称。收起时看不见，但仍然是这一项的可访问名称 */
  children: ReactNode;
};

export type SideRailItemProps = ItemOwnProps &
  Omit<ComponentProps<"li">, keyof ItemOwnProps>;

/** 侧轨里的一个栏目。 */
export function SideRailItem({
  icon,
  current = false,
  end,
  disabled = false,
  href,
  target,
  rel,
  render,
  onClick,
  children,
  ...props
}: SideRailItemProps) {
  const { collapsed } = useContext(SideRailContext);
  const { anchorRef, portalRef } = usePortalScope();
  const isLink = href !== undefined || render !== undefined;

  const classes = cn(
    // 左内边距 20px + 24px 的图标位：收起成 64px 时图标正好居中，展开收起时它不跑位
    "relative flex h-12 w-full items-center gap-3 pr-4 pl-5 text-left text-sm font-medium",
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRingInset,
    disabled
      ? "cursor-not-allowed text-ink-disabled"
      : [
          current ? "font-bold text-ink" : "text-ink-secondary",
          "hover:bg-surface-muted hover:text-ink",
          // 收起时浮出来的那块文字还开着：这一项保持同样的底，两块连成一条
          "data-popup-open:bg-surface-muted data-popup-open:text-ink",
        ],
    current &&
      "before:absolute before:top-1/2 before:left-0 before:h-5 before:w-1 before:-translate-y-1/2 before:bg-ink before:content-['']",
  );

  const content = (
    <>
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center [&_svg]:size-5"
      >
        {icon}
      </span>
      <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>
        {children}
      </span>
      {!collapsed && end && (
        <span className="flex shrink-0 items-center">{end}</span>
      )}
    </>
  );

  const control = isLink ? (
    <LinkElement
      render={render}
      // 禁用的链接去掉 href，保留 link 角色，让读屏仍能读出"不可用"
      href={disabled ? undefined : href}
      role={disabled ? "link" : undefined}
      aria-disabled={disabled || undefined}
      target={target}
      rel={rel}
      aria-current={current ? "page" : undefined}
      onClick={disabled ? (event) => event.preventDefault() : onClick}
      className={classes}
    >
      {content}
    </LinkElement>
  ) : (
    <button
      type="button"
      disabled={disabled}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className={classes}
    >
      {content}
    </button>
  );

  return (
    <li {...props}>
      {collapsed && !disabled ? (
        // 收起时，悬停或键盘聚焦：一块同色的底从这一项向右展开，里面是栏目名。
        // 它挂在 <body> 下，侧轨自己滚动也裁不到它；只给眼睛看，读屏读的是项里的隐藏文字
        <BaseTooltip.Root>
          <BaseTooltip.Trigger
            ref={anchorRef}
            render={control}
            delay={0}
            closeDelay={0}
          />
          <BaseTooltip.Portal ref={portalRef}>
            <BaseTooltip.Positioner
              side="right"
              align="center"
              sideOffset={0}
              className="pointer-events-none z-(--z-overlay)"
            >
              <BaseTooltip.Popup
                aria-hidden="true"
                className={cn(
                  "flex h-(--anchor-height) items-center bg-surface-muted pr-5 pl-1 text-sm font-medium whitespace-nowrap text-ink",
                  // 从侧轨一侧拉开
                  "[clip-path:inset(0)] transition-[clip-path] duration-(--duration-fast) ease-exit data-instant:transition-none",
                  "data-ending-style:[clip-path:inset(0_100%_0_0)] data-starting-style:[clip-path:inset(0_100%_0_0)]",
                )}
              >
                {children}
              </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
          </BaseTooltip.Portal>
        </BaseTooltip.Root>
      ) : (
        control
      )}
    </li>
  );
}

export type SideRailGroupProps = Omit<ComponentProps<"li">, "children"> & {
  /** 这一组的小标题。收起时换成一条短线，名称仍然读得到 */
  label: string;
  /** `SideRailItem` */
  children: ReactNode;
};

/** 把几个栏目归成一组。栏目多的时候用；不做能展开收起的二级。 */
export function SideRailGroup({
  label,
  className,
  children,
  ...props
}: SideRailGroupProps) {
  const { collapsed } = useContext(SideRailContext);

  return (
    <li {...props} className={cn("not-first:mt-2", className)}>
      {collapsed ? (
        <div
          aria-hidden="true"
          className="mx-auto mb-2 h-px w-6 bg-line-strong [li:first-child>&]:hidden"
        />
      ) : (
        <div
          aria-hidden="true"
          className="truncate px-5 pt-2 pb-1 font-tech text-xs text-ink-tertiary"
        >
          {`// ${label}`}
        </div>
      )}
      <ul aria-label={label}>{children}</ul>
    </li>
  );
}
