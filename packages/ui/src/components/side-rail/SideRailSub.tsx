import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { usePortalScope } from "../../hooks/usePortalScope";
import { TriangleRight } from "../../icons/TriangleRight";
import { cn } from "../../lib/cn";
import { defined } from "../../lib/defined";
import { focusRingInset } from "../../lib/focus-ring";
import {
  menuGroupLabel,
  menuItem,
  menuItemCurrent,
  menuItemHover,
  menuPanel,
} from "../dropdown-menu/menu-style";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";
import { RailIcon, railItemClass, SideRailContext } from "./SideRail";

/** 子项要知道自己是排在侧轨里，还是在收起时弹出的那块菜单里 */
const SubContext = createContext<"list" | "menu">("list");

type SubOwnProps = {
  /** 图标。收起时只剩它 */
  icon: ReactNode;
  /** 这一组的名称：父项上的文字，也是子列表和菜单的名称 */
  label: string;
  /** 展开着吗。只在侧轨展开时有意义；收起的侧轨上是弹出的菜单 */
  open?: boolean;
  /**
   * 一开始展开着吗。默认：当前项在里面就展开。
   * 之后当前项换到了里面（从别处导航过来），也会自己展开
   */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 直接放 `SideRailSubItem` */
  children: ReactNode;
};

export type SideRailSubProps = SubOwnProps &
  Omit<ComponentProps<"li">, keyof SubOwnProps>;

/**
 * 侧轨里带二级的栏目。父项本身不是一个去处：点它只是展开收起。
 * 侧轨收起时没有地方就地展开，改成向右弹出一块菜单。
 */
export function SideRailSub({
  icon,
  label,
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: SideRailSubProps) {
  const { collapsed } = useContext(SideRailContext);
  const { anchorRef, portalRef } = usePortalScope();

  // 当前项在不在里面：从子元素上读，所以 SideRailSubItem 要直接放在这里
  const containsCurrent = Children.toArray(children).some(
    (child) =>
      isValidElement<{ current?: unknown }>(child) &&
      child.props.current === true,
  );

  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? containsCurrent,
    onChange: onOpenChange,
  });

  // 当前项换到了里面（从别处导航过来的）：自己展开，否则它藏着，看不出人在哪
  const contained = useRef(containsCurrent);
  useEffect(() => {
    if (containsCurrent && !contained.current) setOpen(true);
    contained.current = containsCurrent;
  }, [containsCurrent, setOpen]);

  if (collapsed) {
    return (
      <li {...props}>
        {/* 悬停打开的菜单本来就不锁页面；点开的也不锁——它是导航，不是一组操作 */}
        <BaseMenu.Root modal={false}>
          <BaseMenu.Trigger
            ref={anchorRef}
            openOnHover
            delay={0}
            // 子项都藏在菜单里：当前项在里面时，父项替它显示成当前的样子
            className={railItemClass({
              current: containsCurrent,
              disabled: false,
            })}
          >
            <RailIcon>{icon}</RailIcon>
            <span className="sr-only">{label}</span>
          </BaseMenu.Trigger>
          <BaseMenu.Portal ref={portalRef}>
            <BaseMenu.Positioner
              side="right"
              align="start"
              sideOffset={0}
              className="z-(--z-overlay) outline-none"
            >
              <BaseMenu.Popup
                className={cn(
                  menuPanel,
                  "max-h-(--available-height) overflow-y-auto overscroll-contain",
                )}
              >
                <BaseMenu.Group>
                  <BaseMenu.GroupLabel className={menuGroupLabel}>
                    {label}
                  </BaseMenu.GroupLabel>
                  <SubContext value="menu">{children}</SubContext>
                </BaseMenu.Group>
              </BaseMenu.Popup>
            </BaseMenu.Positioner>
          </BaseMenu.Portal>
        </BaseMenu.Root>
      </li>
    );
  }

  return (
    <li {...props}>
      <BaseCollapsible.Root open={open} onOpenChange={(next) => setOpen(next)}>
        <BaseCollapsible.Trigger
          className={(state) =>
            cn(
              "group/sub",
              // 展开时短竖条在子项上；收着的时候父项替它显示
              railItemClass({
                current: containsCurrent && !state.open,
                disabled: false,
              }),
              // 当前项在里面：展开着父项也不退回次要色
              containsCurrent && "text-ink",
            )
          }
        >
          <RailIcon>{icon}</RailIcon>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <TriangleRight
            size={8}
            className="shrink-0 transition-transform duration-(--duration-fast) ease-standard group-data-panel-open/sub:rotate-90"
          />
        </BaseCollapsible.Trigger>
        <BaseCollapsible.Panel
          className={cn(
            "h-(--collapsible-panel-height) overflow-hidden",
            "transition-[height] duration-(--duration-base) ease-standard",
            "data-ending-style:h-0 data-starting-style:h-0",
          )}
        >
          {/* 引线对着父项图标的中线（左起 32px） */}
          <ul
            aria-label={label}
            className="relative before:absolute before:inset-y-0 before:left-8 before:w-px before:bg-line before:content-['']"
          >
            <SubContext value="list">{children}</SubContext>
          </ul>
        </BaseCollapsible.Panel>
      </BaseCollapsible.Root>
    </li>
  );
}

type SubItemOwnProps = {
  /** 当前所在的页面：墨色、加粗，引线在这一段变成粗条；输出 `aria-current="page"` */
  current?: boolean;
  /** 行尾的补充：计数、角标 */
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
  children: ReactNode;
};

export type SideRailSubItemProps = SubItemOwnProps &
  Omit<ComponentProps<"li">, keyof SubItemOwnProps>;

/** 二级里的一项。直接放在 `SideRailSub` 里。 */
export function SideRailSubItem({
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
}: SideRailSubItemProps) {
  const placement = useContext(SubContext);
  const isLink = href !== undefined || render !== undefined;

  const content = (
    <>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {end && <span className="flex shrink-0 items-center">{end}</span>}
    </>
  );

  // 收起的侧轨：这一项是弹出菜单里的一个菜单项
  if (placement === "menu") {
    const classes = cn(
      menuItem,
      current ? menuItemCurrent.plain : menuItemHover,
    );
    return isLink ? (
      <BaseMenu.LinkItem
        render={render}
        {...defined({ href: disabled ? undefined : href, target, rel })}
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled || undefined}
        data-disabled={disabled ? "" : undefined}
        closeOnClick
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        className={classes}
      >
        {content}
      </BaseMenu.LinkItem>
    ) : (
      <BaseMenu.Item
        disabled={disabled}
        aria-current={current ? "page" : undefined}
        onClick={onClick}
        className={classes}
      >
        {content}
      </BaseMenu.Item>
    );
  }

  const classes = cn(
    // 文字和父项的文字对齐：20px 的内边距 + 24px 的图标位 + 12px 的间隔
    "relative flex h-10 w-full items-center gap-3 pr-4 pl-14 text-left text-sm",
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRingInset,
    disabled
      ? "cursor-not-allowed text-ink-disabled"
      : [
          current ? "font-bold text-ink" : "text-ink-secondary",
          "hover:bg-surface-muted hover:text-ink",
        ],
    // 引线在当前项这一段换成粗条
    current &&
      "before:absolute before:inset-y-2 before:left-[31px] before:w-[3px] before:bg-ink before:content-['']",
  );

  return (
    <li {...props}>
      {isLink ? (
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
      )}
    </li>
  );
}
