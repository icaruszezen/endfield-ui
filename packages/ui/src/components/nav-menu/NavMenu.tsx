import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  createContext,
  useContext,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { usePortalScope } from "../../hooks/usePortalScope";
import { ArrowRight } from "../../icons/ArrowRight";
import { Close } from "../../icons/Close";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";
import { firstFocusableIn } from "../dialog/initial-focus";
import { GhostText } from "../ghost-text/GhostText";
import { IconButton } from "../icon-button/IconButton";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";
import { NavActionContext } from "../nav-action/NavAction";

/** 导航项点了之后要把菜单关上 */
const NavMenuContext = createContext<() => void>(() => {});

export type NavMenuProps = {
  /** 菜单钮，通常是顶栏最右边的 `<IconButton>`。不传就用 `open` / `onOpenChange` 自己控制 */
  trigger?: ReactElement<Record<string, unknown>>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 菜单的名称，读屏打开时读它。没有 `brand` 时也显示在最上面一行 */
  title: ReactNode;
  /** 最上面一行左边的标志，通常和顶栏的是同一个 */
  brand?: ReactNode;
  /** 导航项下面的一排工具按钮 */
  tools?: ReactNode;
  /** 底部通宽的按钮：放一到两个 `NavAction` */
  footer?: ReactNode;
  /** 背景底部的一行镂空巨字，纯装饰。写一个短词 */
  ghost?: string;
  /** 里面那组栏目的名称 */
  navLabel?: string;
  /** 关闭钮的可访问名称 */
  closeLabel?: string;
  /** 给整块面板 */
  className?: string;
  /** `NavMenuItem` */
  children: ReactNode;
};

/**
 * 全屏菜单：窄屏上顶栏的菜单钮打开的那一整屏栏目。
 * 打开时焦点移入并被限制在内、背景不可滚动；`Esc` 关闭，焦点回到菜单钮。
 */
export function NavMenu({
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  title,
  brand,
  tools,
  footer,
  ghost,
  navLabel = "主导航",
  closeLabel = "关闭菜单",
  className,
  children,
}: NavMenuProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const { anchorRef, portalRef } = usePortalScope();
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <BaseDialog.Root open={isOpen} onOpenChange={(next) => setOpen(next)}>
      {trigger && <BaseDialog.Trigger ref={anchorRef} render={trigger} />}
      <BaseDialog.Portal ref={portalRef}>
        <BaseDialog.Popup
          // 焦点先落在第一个栏目上，而不是关闭钮
          initialFocus={firstFocusableIn(bodyRef)}
          className={cn(
            "fixed inset-0 z-(--z-overlay) flex flex-col overflow-hidden bg-surface text-ink outline-none",
            // 整层淡入；里面的栏目另有自己的入场（见 itemEnter）
            "transition-opacity duration-(--duration-fast) ease-standard",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            className,
          )}
        >
          {/* 和顶栏等高：关闭钮正好落在菜单钮的位置上 */}
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-4">
            <div className="flex min-w-0 flex-1 items-center">
              {brand}
              <BaseDialog.Title
                className={brand ? "sr-only" : "truncate text-base font-medium"}
              >
                {title}
              </BaseDialog.Title>
            </div>
            <BaseDialog.Close
              render={
                <IconButton aria-label={closeLabel}>
                  <Close />
                </IconButton>
              }
            />
          </div>

          <div
            ref={bodyRef}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
          >
            <NavMenuContext value={() => setOpen(false)}>
              <nav aria-label={navLabel}>
                <ul className="flex flex-col gap-1 p-4">{children}</ul>
              </nav>
            </NavMenuContext>

            {tools && (
              <div className="mx-4 flex flex-wrap gap-1 bg-surface-muted p-1">
                {tools}
              </div>
            )}

            {/* 栏目和底部按钮之间的空白。巨字贴着它的下沿，下半截裁掉 */}
            <div
              aria-hidden="true"
              className={cn(
                "relative flex-1 overflow-hidden",
                ghost && "min-h-20",
              )}
            >
              {ghost && (
                <GhostText
                  variant="outline"
                  className="absolute bottom-0 left-4 translate-y-1/4"
                >
                  {ghost}
                </GhostText>
              )}
            </div>

            {footer && (
              <div className="flex shrink-0 flex-col gap-2 p-4">
                <NavActionContext value="block">{footer}</NavActionContext>
              </div>
            )}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/*
 * 栏目入场：逐条从左滑入 8px。第一项等层淡入过半（100ms），之后每项晚 50ms，
 * 第六项起一起到——从第一项动到最后一项停下 550ms。
 * 只动 <li> 的位置和透明度：焦点一打开就在第一项上，键盘不用等它
 */
const itemEnter = [
  "animate-shift-in [--shift-x:calc(var(--motion-shift-lg)*-1)]",
  "[animation-delay:100ms] nth-2:[animation-delay:150ms] nth-3:[animation-delay:200ms]",
  "nth-4:[animation-delay:250ms] nth-5:[animation-delay:300ms] nth-[n+6]:[animation-delay:350ms]",
].join(" ");

type ItemOwnProps = {
  /** 图标，后面跟一条竖向的分隔线 */
  icon?: ReactNode;
  /** 当前所在的栏目：整条变信号黄，输出 `aria-current="page"` */
  current?: boolean;
  disabled?: boolean;
  /** 点了之后是否关掉菜单，默认关 */
  closeOnClick?: boolean;
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

export type NavMenuItemProps = ItemOwnProps &
  Omit<ComponentProps<"li">, keyof ItemOwnProps>;

/** 全屏菜单里的一个栏目。 */
export function NavMenuItem({
  icon,
  current = false,
  disabled = false,
  closeOnClick = true,
  href,
  target,
  rel,
  render,
  onClick,
  className,
  children,
  ...props
}: NavMenuItemProps) {
  const close = useContext(NavMenuContext);
  const isLink = href !== undefined || render !== undefined;

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
    if (closeOnClick) close();
  };

  const classes = cn(
    "relative flex h-14 w-full items-center gap-3 px-4 text-left text-base font-medium",
    "transition-colors duration-(--duration-fast) ease-standard",
    disabled
      ? "cursor-not-allowed bg-surface-sunken text-ink-disabled"
      : current
        ? [
            // 黄和旁边的浅灰明度很接近：另加粗体和左缘一条墨色竖条，不只靠颜色
            "bg-action font-bold text-on-action",
            "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-on-action before:content-['']",
            // 普通的焦点色在暗色主题下也是黄的，压在黄底上看不见
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-on-action",
          ]
        : [
            "bg-surface-sunken text-ink hover:bg-surface-muted active:bg-line",
            focusRingInset,
          ],
  );

  const mark = disabled
    ? "text-ink-disabled"
    : current
      ? "text-on-action"
      : "text-ink-secondary";

  const content = (
    <>
      {icon && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "flex size-6 shrink-0 items-center justify-center [&_svg]:size-5",
              mark,
            )}
          >
            {icon}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "h-5 w-px shrink-0",
              current && !disabled ? "bg-on-action" : "bg-line-strong",
            )}
          />
        </>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ArrowRight size={16} className={cn("shrink-0", mark)} />
    </>
  );

  return (
    <li {...props} className={cn(itemEnter, className)}>
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
          onClick={handleClick}
          className={classes}
        >
          {content}
        </LinkElement>
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-current={current ? "page" : undefined}
          onClick={handleClick}
          className={classes}
        >
          {content}
        </button>
      )}
    </li>
  );
}
