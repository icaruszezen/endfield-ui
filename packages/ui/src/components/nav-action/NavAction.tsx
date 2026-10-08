import {
  createContext,
  useContext,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { TriangleRight } from "../../icons/TriangleRight";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";

export type NavActionLayout = "inline" | "block" | "stacked";

/** 侧轨和全屏菜单用它告诉里面的主行动块该怎么摆。不对外导出 */
export const NavActionContext = createContext<NavActionLayout | null>(null);

type OwnProps = {
  /** 换掉默认的实心三角 */
  icon?: ReactNode;
  /**
   * 摆法。放在侧轨、全屏菜单里时由它们决定，一般不用传：
   * - `inline` 40px 高的横块，顶栏里；
   * - `block` 48px 高的通宽横条，展开的侧轨和全屏菜单的底部；
   * - `stacked` 48px 宽、至少 96px 高的竖块，文字竖排，收起的侧轨里。
   */
  layout?: NavActionLayout;
  /** 传了就渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替 `<a>`（路由库的链接组件）。传了就按链接处理 */
  render?: LinkRender;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  children: ReactNode;
};

export type NavActionProps = OwnProps &
  Omit<ComponentProps<"button">, keyof OwnProps | "type">;

const layoutClass: Record<NavActionLayout, string> = {
  inline: "inline-flex h-10 items-center gap-2.5 px-4 text-sm",
  block: "flex h-12 w-full items-center gap-3 px-4 text-base",
  // 竖排的文字长了就往下长：96px 是最小高度
  stacked:
    "flex min-h-24 w-12 flex-col items-center justify-center gap-2 py-3 text-sm",
};

/**
 * 主行动块：整个产品最主要的那一个去处（"前往控制台"）。
 * 反转的一整块，悬停时变成信号黄。侧轨、顶栏、全屏菜单的底部放的都是它；
 * 一个界面里只放一个。
 */
export function NavAction({
  icon,
  layout: layoutProp,
  href,
  target,
  rel,
  render,
  onClick,
  disabled = false,
  className,
  children,
  ...props
}: NavActionProps) {
  const inherited = useContext(NavActionContext);
  const layout = layoutProp ?? inherited ?? "inline";
  const stacked = layout === "stacked";

  const classes = cn(
    "shrink-0 font-medium whitespace-nowrap select-none",
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRing,
    layoutClass[layout],
    disabled
      ? "cursor-not-allowed bg-disabled text-on-disabled"
      : "bg-surface-inverse text-ink-inverse hover:bg-action hover:text-on-action active:bg-action-pressed active:text-on-action",
    className,
  );

  const content = (
    <>
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center [&_svg]:size-3"
      >
        {icon ?? <TriangleRight />}
      </span>
      {/* 图标与文字之间一条半透明的细线，跟着字色走 */}
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 bg-current opacity-30",
          stacked ? "h-px w-4" : "h-4 w-px",
        )}
      />
      <span
        className={cn(
          stacked
            ? "tracking-label [writing-mode:vertical-rl]"
            : "min-w-0 truncate",
        )}
      >
        {children}
      </span>
    </>
  );

  if (href !== undefined || render !== undefined) {
    return (
      <LinkElement
        render={render}
        // 禁用的链接去掉 href，保留 link 角色，让读屏仍能读出"不可用"
        href={disabled ? undefined : href}
        role={disabled ? "link" : undefined}
        aria-disabled={disabled || undefined}
        target={target}
        rel={rel}
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        data-layout={layout}
        className={classes}
      >
        {content}
      </LinkElement>
    );
  }

  return (
    <button
      {...props}
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-layout={layout}
      className={classes}
    >
      {content}
    </button>
  );
}
