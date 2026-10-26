import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { ArrowCorner } from "../../icons/ArrowCorner";
import { ChevronLeft } from "../../icons/ChevronLeft";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";
import { Spinner } from "../spinner/Spinner";

export type ButtonVariant =
  "control" | "action" | "light" | "back" | "text" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type OwnProps = {
  /**
   * - `control` 深灰底，默认；暗色主题下是半透明的白；
   * - `action` 信号黄底，一屏只用一个；
   * - `light` 浅灰底加一层点阵，用在深色底上或作次要项；
   * - `back` 深灰斜纹底 + 左箭头，返回上一级；
   * - `text` 无底、下划线、斜箭头，低强调；
   * - `danger` 红底白字，用于不可逆操作。
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 文字左侧的图标，和文字之间隔一条细竖线 */
  iconStart?: ReactNode;
  /** 文字右侧的图标；`text` 变体默认是斜箭头，传 `null` 去掉 */
  iconEnd?: ReactNode;
  /** 提交中：显示旋转指示，尺寸不变，不响应点击 */
  loading?: boolean;
  /** 提交中显示的文字，如"处理中"。传了之后按钮按两段文字里较宽的一段定宽 */
  loadingText?: ReactNode;
  /** 撑满容器宽度 */
  block?: boolean;
  disabled?: boolean;
};

type ButtonAsButton = OwnProps &
  Omit<ComponentProps<"button">, keyof OwnProps> & {
    href?: undefined;
    render?: undefined;
  };
type ButtonAsLink = OwnProps &
  Omit<ComponentProps<"a">, keyof OwnProps> & {
    /** 传了就渲染成链接 */
    href: string;
    render?: LinkRender;
  };
type ButtonAsRendered = OwnProps &
  Omit<ComponentProps<"a">, keyof OwnProps> & {
    href?: undefined;
    /**
     * 用这个元素代替 `<a>`，给路由库的链接组件用：
     * `<Button render={<Link to="/archive" />}>`。传了就按链接处理
     */
    render: LinkRender;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsRendered;

/** 没有记号的三种：左右留白对称，悬停只换底色 */
const plainVariants: ReadonlySet<ButtonVariant> = new Set([
  "control",
  "light",
  "danger",
]);

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 text-sm",
  md: "h-10 gap-2 text-base",
  lg: "h-14 gap-2.5 text-lg",
};

const plainPadding: Record<ButtonSize, string> = {
  sm: "min-w-16 px-4",
  md: "min-w-24 px-6",
  lg: "min-w-40 px-8",
};

/* 没有图标时，加载中的旋转方块放在左侧留白的正中：不挤文字，宽度也不变 */
const paddingSpinner: Record<ButtonSize, string> = {
  sm: "left-[5px] size-1.5",
  md: "left-2 size-2",
  lg: "left-[11px] size-2.5",
};

/* 图标和文字之间的细竖线（官网 /cloud 顶栏的按钮）；两边的空由 gap 给 */
const dividerSize: Record<ButtonSize, string> = {
  sm: "h-3",
  md: "h-3.5",
  lg: "h-4",
};

/* action：文字在分隔线左侧的区域里居中，分隔线右侧留一窄条 */
const actionPadding: Record<ButtonSize, string> = {
  sm: "min-w-16 pl-4 pr-8",
  md: "min-w-24 pl-6 pr-11",
  lg: "min-w-40 pl-8 pr-15",
};

const actionDivider: Record<ButtonSize, string> = {
  sm: "right-3.5 w-0.5",
  md: "right-4.5 w-[3px]",
  lg: "right-6 w-[3px]",
};

const actionSpinner: Record<ButtonSize, string> = {
  sm: "right-[3px] size-2",
  md: "right-[5px] size-2",
  lg: "right-1.5 size-3",
};

const backPadding: Record<ButtonSize, string> = {
  sm: "min-w-16 px-3.5",
  md: "min-w-24 px-5",
  lg: "min-w-40 px-7",
};

const inlineIconSize: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 20 };

const enabledClass: Record<ButtonVariant, string> = {
  control:
    "bg-button text-on-button shadow-xs hover:bg-button-hover hover:text-white active:bg-button-pressed active:text-white",
  // 两个主题下是同一个红：暗色主题的 danger 是文字色，配白字不到 4.5:1
  danger:
    "bg-alert-fill text-white shadow-xs hover:bg-alert-fill-hover active:bg-alert-fill-pressed",
  // 有意不随主题翻转：它本来就是给深色底用的。点阵也写成固定的墨色比例，悬停、按下只换底色
  light:
    "dot-grid bg-neutral-100 text-neutral-900 shadow-xs [--dot-color:color-mix(in_srgb,var(--color-neutral-900)_8%,transparent)] [--dot-gap:4px] [--dot-size:0.5px] hover:bg-neutral-50 active:bg-neutral-200",
  // 黄色按钮悬停时底色不变，只有分隔线加深
  action: "bg-action text-on-action shadow-md active:bg-action-pressed",
  back: "hatch hatch-mid bg-control text-white shadow-xs hover:bg-neutral-600 active:bg-control-pressed",
  text: "text-ink active:text-ink-secondary",
};

/*
 * 高对比模式（forced-colors）下底色被系统换成页面色，带底色的变体只剩一行字：
 * 补一圈线，细竖线、分隔线、加载中的方块这些底色画的记号改用按钮的字色。
 * 禁用的线、字、记号都是灰字色——链接形态禁用时是一个去掉了地址的 <a>，
 * 系统不会替它把字换灰，所以字色也写明
 */
const forcedOutline = "forced-colors:border";
const forcedEnabled = "forced-colors:border-[ButtonText]";
const forcedDisabled =
  "forced-colors:border-[GrayText] forced-colors:text-[GrayText]";

export function Button(props: ButtonProps) {
  const {
    variant = "control",
    size = "md",
    iconStart,
    iconEnd,
    loading = false,
    loadingText,
    block = false,
    disabled = false,
    className,
    children,
    ...rest
  } = props;

  const inert = disabled || loading;
  const isText = variant === "text";
  const plain = plainVariants.has(variant);
  const iconSize = inlineIconSize[size];
  // 记号在高对比模式下的颜色：细竖线、分隔线、旋转方块共用
  const forcedMark = disabled
    ? "forced-colors:bg-[GrayText]"
    : "forced-colors:bg-[ButtonText]";

  const classes = cn(
    "group relative inline-flex shrink-0 items-center justify-center font-medium leading-none whitespace-nowrap select-none",
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRing,
    sizeClass[size],
    plain && plainPadding[size],
    variant === "action" && actionPadding[size],
    variant === "back" && backPadding[size],
    isText ? "h-auto border-b border-current py-1" : "rounded-sm",
    disabled
      ? isText
        ? "cursor-not-allowed text-ink-disabled"
        : "cursor-not-allowed bg-disabled text-on-disabled"
      : enabledClass[variant],
    // text 变体靠下划线成形，不补线；它的下划线跟着字色走，禁用时一起写明
    !isText && forcedOutline,
    disabled ? forcedDisabled : !isText && forcedEnabled,
    // 加载中不是禁用：线和字照旧。链接形态这时候同样去掉了地址，字色写明，和线一个颜色
    loading && !disabled && "forced-colors:text-[ButtonText]",
    loading && "pointer-events-none",
    block && "flex w-full",
    className,
  );

  // 加载时旋转指示占一个已经有的位置（图标、留白、分隔线右侧的窄条），所以按钮的宽度不会变
  const spinnerBox = (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: iconSize, height: iconSize }}
    >
      <Spinner label={null} className={cn("size-2", forcedMark)} />
    </span>
  );
  let start = iconStart;
  let end = iconEnd;
  if (variant === "back" && start === undefined) {
    start = <ChevronLeft size={iconSize} />;
  }
  const hasStart = start !== undefined && start !== null && start !== false;
  // action 的旋转方块在分隔线右边，text 的在末尾：它们的图标照旧
  if (loading && hasStart && !isText && variant !== "action") {
    start = spinnerBox;
  }
  if (isText && end === undefined) {
    end = loading ? (
      spinnerBox
    ) : (
      <ArrowCorner
        size={iconSize}
        className={cn(
          "transition-[translate] duration-(--duration-base) ease-standard",
          !disabled &&
            "group-hover:translate-x-0.5 group-hover:translate-y-0.5",
        )}
      />
    );
  }

  const label =
    loadingText === undefined ? (
      children
    ) : (
      // 两段文字叠在同一格里，按较宽的一段定宽；不显示的那段同时对读屏隐藏
      <span className="grid justify-items-center">
        <span
          aria-hidden={loading || undefined}
          className={cn("col-start-1 row-start-1", loading && "invisible")}
        >
          {children}
        </span>
        <span
          aria-hidden={!loading || undefined}
          className={cn("col-start-1 row-start-1", !loading && "invisible")}
        >
          {loadingText}
        </span>
      </span>
    );

  const content = (
    <>
      {plain && loading && !hasStart && (
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2",
            paddingSpinner[size],
          )}
        >
          <Spinner label={null} className={cn("block size-full", forcedMark)} />
        </span>
      )}
      {start}
      {hasStart && !isText && (
        <span
          aria-hidden="true"
          data-button-divider=""
          className={cn(
            // 高对比模式下是实色的一条：底色画的线系统会换掉，半透明也看不清
            "w-px shrink-0 bg-current opacity-30 forced-colors:opacity-100",
            dividerSize[size],
            forcedMark,
          )}
        />
      )}
      {label}
      {end}
      {variant === "action" && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-[17.5%] h-[65%]",
              "transition-colors duration-(--duration-fast) ease-standard",
              actionDivider[size],
              disabled
                ? "bg-on-disabled/20"
                : [
                    "bg-on-action/10 group-hover:bg-on-action/15 group-active:bg-on-action/20",
                    // 悬停、按下那两档带着状态，优先级比单写的高：高对比模式下各写一份
                    "forced-colors:group-hover:bg-[ButtonText] forced-colors:group-active:bg-[ButtonText]",
                  ],
              forcedMark,
            )}
          />
          {loading && (
            <span
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2",
                actionSpinner[size],
              )}
            >
              <Spinner
                label={null}
                className={cn("block size-full", forcedMark)}
              />
            </span>
          )}
        </>
      )}
    </>
  );

  const shared = {
    className: classes,
    "data-variant": variant,
    "data-size": size,
    "data-loading": loading ? "" : undefined,
    "aria-busy": loading || undefined,
  };

  if (rest.href !== undefined || rest.render !== undefined) {
    const { href, render, onClick, ...anchorProps } = rest;
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };
    return (
      <LinkElement
        {...anchorProps}
        {...shared}
        render={render}
        // 禁用的链接去掉 href，保留 link 角色，让读屏仍能读出"不可用"
        href={inert ? undefined : href}
        role={inert ? "link" : anchorProps.role}
        aria-disabled={inert || undefined}
        onClick={handleClick}
      >
        {content}
      </LinkElement>
    );
  }

  const {
    href: _href,
    render: _render,
    onClick,
    type = "button",
    ...buttonProps
  } = rest;
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (inert) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      {...buttonProps}
      {...shared}
      type={type}
      disabled={disabled}
      // 加载中不用原生 disabled：保住焦点，读屏还能读到"忙碌"
      aria-disabled={loading || undefined}
      onClick={handleClick}
    >
      {content}
    </button>
  );
}
