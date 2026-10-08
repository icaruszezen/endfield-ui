import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { ArrowCorner } from "../../icons/ArrowCorner";
import { ChevronLeft } from "../../icons/ChevronLeft";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { Spinner } from "../spinner/Spinner";

export type ButtonVariant =
  | "control"
  | "action"
  | "light"
  | "back"
  | "text"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type OwnProps = {
  /**
   * - `control` 深灰底 + 黄色竖条，默认；
   * - `action` 信号黄底，一屏只用一个；
   * - `light` 白底，用在深色底上或作次要项；
   * - `back` 深灰斜纹底 + 左箭头，返回上一级；
   * - `text` 无底、下划线、斜箭头，低强调；
   * - `danger` 同 `control`，竖条为红色，用于不可逆操作。
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 文字左侧的图标 */
  iconStart?: ReactNode;
  /** 文字右侧的图标；`text` 变体默认是斜箭头，传 `null` 去掉 */
  iconEnd?: ReactNode;
  /** 提交中：记号变成旋转指示，尺寸不变，不响应点击 */
  loading?: boolean;
  /** 提交中显示的文字，如"处理中"。传了之后按钮按两段文字里较宽的一段定宽 */
  loadingText?: ReactNode;
  /** 撑满容器宽度 */
  block?: boolean;
  disabled?: boolean;
};

type ButtonAsButton = OwnProps &
  Omit<ComponentProps<"button">, keyof OwnProps> & { href?: undefined };
type ButtonAsLink = OwnProps &
  Omit<ComponentProps<"a">, keyof OwnProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** 左侧带竖条的变体：竖条绝对定位，不参与文字居中 */
const markerColor: Partial<Record<ButtonVariant, string>> = {
  control: "bg-action",
  light: "bg-neutral-500",
  danger: "bg-alert",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 text-sm",
  md: "h-10 gap-2 text-base",
  lg: "h-14 gap-2.5 text-lg",
};

/*
 * 带竖条的变体左右留白对称，并且比规格表的"水平内边距"更宽：
 * 要给"箭头盒 + 悬停位移"留出位置，文字再长也不会被箭头压到。
 */
const markerPadding: Record<ButtonSize, string> = {
  sm: "min-w-16 px-7",
  md: "min-w-24 px-10",
  lg: "min-w-40 px-13",
};

const markerBox: Record<ButtonSize, string> = {
  sm: "left-3 h-4 w-2 [--marker-bar:2px]",
  md: "left-4 h-5 w-2.5",
  lg: "left-6 h-7 w-3",
};

const markerShift: Record<ButtonSize, string> = {
  sm: "group-hover:translate-x-1 group-active:translate-x-1",
  md: "group-hover:translate-x-1.5 group-active:translate-x-1.5",
  lg: "group-hover:translate-x-2 group-active:translate-x-2",
};

const markerSpinner: Record<ButtonSize, string> = {
  sm: "left-3 size-2",
  md: "left-4 size-2.5",
  lg: "left-6 size-3",
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
    "bg-control text-on-control shadow-xs hover:bg-control-hover hover:text-white active:bg-control-pressed active:text-white",
  danger:
    "bg-control text-on-control shadow-xs hover:bg-control-hover hover:text-white active:bg-control-pressed active:text-white",
  // 有意不随主题翻转：它本来就是给深色底用的
  light:
    "bg-neutral-0 text-neutral-900 shadow-xs hover:bg-neutral-100 active:bg-neutral-200",
  // 黄色按钮悬停时底色不变，只有分隔线加深
  action: "bg-action text-on-action shadow-md active:bg-action-pressed",
  back: "hatch hatch-mid bg-control text-white shadow-xs hover:bg-neutral-600 active:bg-control-pressed",
  text: "text-ink active:text-ink-secondary",
};

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
  const marker = markerColor[variant];
  const iconSize = inlineIconSize[size];

  const classes = cn(
    "group relative inline-flex shrink-0 items-center justify-center font-medium leading-none whitespace-nowrap select-none",
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRing,
    sizeClass[size],
    marker && markerPadding[size],
    variant === "action" && actionPadding[size],
    variant === "back" && backPadding[size],
    isText && "h-auto border-b border-current py-1",
    disabled
      ? isText
        ? "cursor-not-allowed text-ink-disabled"
        : "cursor-not-allowed bg-disabled text-on-disabled"
      : enabledClass[variant],
    loading && "pointer-events-none",
    block && "flex w-full",
    className,
  );

  // 每个变体自己的记号在加载时变成旋转指示，所以按钮的宽度不会变
  let start = iconStart;
  let end = iconEnd;
  if (variant === "back" && start === undefined) {
    start = loading ? (
      <span
        className="inline-flex items-center justify-center"
        style={{ width: iconSize, height: iconSize }}
      >
        <Spinner label={null} className="size-2" />
      </span>
    ) : (
      <ChevronLeft size={iconSize} />
    );
  }
  if (isText && end === undefined) {
    end = loading ? (
      <span
        className="inline-flex items-center justify-center"
        style={{ width: iconSize, height: iconSize }}
      >
        <Spinner label={null} className="size-2" />
      </span>
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
      {marker &&
        (loading ? (
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2",
              markerSpinner[size],
            )}
          >
            <Spinner label={null} className={cn("block size-full", marker)} />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              "marker-bar pointer-events-none absolute top-1/2 -translate-y-1/2",
              "transition-[clip-path,translate] duration-(--duration-base) ease-standard",
              markerBox[size],
              disabled
                ? "bg-on-disabled"
                : [
                    marker,
                    "group-hover:marker-arrow group-active:marker-arrow",
                    markerShift[size],
                  ],
            )}
          />
        ))}
      {start}
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
                : "bg-on-action/10 group-hover:bg-on-action/15 group-active:bg-on-action/20",
            )}
          />
          {loading && (
            <span
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2",
                actionSpinner[size],
              )}
            >
              <Spinner label={null} className="block size-full" />
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

  if (rest.href !== undefined) {
    const { href, onClick, ...anchorProps } = rest;
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };
    return (
      <a
        {...anchorProps}
        {...shared}
        // 禁用的链接去掉 href，保留 link 角色，让读屏仍能读出"不可用"
        href={inert ? undefined : href}
        role={inert ? "link" : anchorProps.role}
        aria-disabled={inert || undefined}
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  const { href: _href, onClick, type = "button", ...buttonProps } = rest;
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
