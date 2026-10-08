import { Menu as BaseMenu } from "@base-ui/react/menu";
import type {
  ComponentProps,
  MouseEvent,
  ReactElement,
  ReactNode,
} from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";

export type FlyoutBarSide = "right" | "left";

export type FlyoutBarProps = {
  /**
   * 触发按钮，通常是 `<IconButton variant="inverse">`。
   * 它的名称（`aria-label`）同时是这一条的名称，读屏打开时会读出来
   */
  trigger: ReactElement<Record<string, unknown>>;
  /** 展开在触发按钮的哪一侧，放不下时自动翻到另一侧。默认 `right` */
  side?: FlyoutBarSide;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 给横条本身 */
  className?: string;
  /** `FlyoutBarItem` */
  children: ReactNode;
};

/**
 * 展开条：从一个图标按钮旁边拉开的一条横排操作，比如分享的几个去处。
 * 语义和键盘都是横向的菜单——左右方向键移动、回车选择、`Esc` 关闭。
 * 选项多于六个、或者要文字才看得懂时，用 `DropdownMenu`。
 */
export function FlyoutBar({
  trigger,
  side = "right",
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
}: FlyoutBarProps) {
  const { anchorRef, portalRef } = usePortalScope();

  return (
    <BaseMenu.Root
      orientation="horizontal"
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange && ((next) => onOpenChange(next))}
    >
      <BaseMenu.Trigger ref={anchorRef} render={trigger} />
      <BaseMenu.Portal ref={portalRef}>
        <BaseMenu.Positioner
          side={side}
          align="center"
          className="z-(--z-overlay) outline-none"
        >
          <BaseMenu.Popup
            // 固定的深色：里面的图标和焦点环都按深色底取值
            data-theme="dark"
            className={cn(
              "flex h-(--anchor-height) min-h-10 items-stretch border border-line bg-surface-raised text-ink-secondary shadow-sm outline-none",
              // 黄色竖条始终贴着触发按钮：翻到另一侧时跟着换边
              "data-[side=left]:border-r-4 data-[side=left]:border-r-action data-[side=right]:border-l-4 data-[side=right]:border-l-action",
              // 从触发按钮一侧拉开。用裁切而不是缩放——缩放会把图标压扁。
              // 负的 inset 给阴影留出位置
              "[clip-path:inset(-12px)] transition-[clip-path] duration-(--duration-base) ease-exit",
              "data-[side=right]:data-ending-style:[clip-path:inset(-12px_100%_-12px_-12px)] data-[side=right]:data-starting-style:[clip-path:inset(-12px_100%_-12px_-12px)]",
              "data-[side=left]:data-ending-style:[clip-path:inset(-12px_-12px_-12px_100%)] data-[side=left]:data-starting-style:[clip-path:inset(-12px_-12px_-12px_100%)]",
              className,
            )}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

type ItemOwnProps = {
  /** 只有图标时必须给：它是这一项的名称 */
  "aria-label"?: string;
  disabled?: boolean;
  /** 点了之后是否关掉。操作项默认关，链接项默认不关 */
  closeOnClick?: boolean;
  /** 传了就渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

export type FlyoutBarItemProps = ItemOwnProps &
  Omit<ComponentProps<"div">, keyof ItemOwnProps | "id" | "style">;

const itemClass = cn(
  "flex min-w-10 cursor-default items-center justify-center gap-2 px-2.5 text-sm select-none",
  "transition-colors duration-(--duration-fast) ease-standard",
  "data-disabled:text-ink-disabled data-highlighted:text-ink",
  "[&_svg]:size-5 [&_svg]:shrink-0",
  focusRingInset,
);

/** 展开条里的一项：子元素是图标，可以再带文字；传 `href` 就是一个链接。 */
export function FlyoutBarItem({
  "aria-label": ariaLabel,
  disabled,
  closeOnClick,
  href,
  target,
  rel,
  onClick,
  className,
  children,
  ...props
}: FlyoutBarItemProps) {
  const classes = cn(itemClass, className);

  if (href !== undefined) {
    return (
      <BaseMenu.LinkItem
        href={href}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        // 只有图标时没有文字可供"按字母跳转"，用名称代替
        label={ariaLabel}
        closeOnClick={closeOnClick}
        onClick={onClick}
        className={classes}
      >
        {children}
      </BaseMenu.LinkItem>
    );
  }

  return (
    <BaseMenu.Item
      {...props}
      aria-label={ariaLabel}
      label={ariaLabel}
      disabled={disabled}
      closeOnClick={closeOnClick}
      onClick={onClick}
      className={classes}
    >
      {children}
    </BaseMenu.Item>
  );
}
