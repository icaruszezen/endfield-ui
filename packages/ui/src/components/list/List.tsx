import {
  createContext,
  useContext,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";
import { GhostText } from "../ghost-text/GhostText";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";
import { bandCanvas, bandGap, bandRow } from "./band-style";

export type ListVariant = "plain" | "band";

export type ListProps = ComponentProps<"ul"> & {
  /**
   * - `plain` 行间一条 1px 的线，默认；
   * - `band` 浅色画布上一条条固定深色的行，行间留缝；选中行整行反转成白底墨字。
   */
  variant?: ListVariant;
};

const ListVariantContext = createContext<ListVariant>("plain");

/** 列表行的容器，外圈不描边。里面只放 `ListRow`。 */
export function List({ variant = "plain", className, ...props }: ListProps) {
  return (
    <ListVariantContext value={variant}>
      <ul
        {...props}
        data-variant={variant}
        className={cn(
          "text-ink",
          variant === "band"
            ? ["flex flex-col", bandCanvas, bandGap]
            : "divide-y divide-line",
          className,
        )}
      />
    </ListVariantContext>
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
  /** 选中：浅灰底 + 左缘黄条 + 标题加粗；在 `band` 列表里是整行反转成白底墨字 */
  selected?: boolean;
  /** 已完成：整行降一档对比，行尾数值前多一个低对比的描边词，读屏多读一句"已完成" */
  completed?: boolean;
  /** 完成态的描边词，默认 `DONE`。纯装饰；传 `null` 去掉 */
  completedWord?: ReactNode;
  /** 40px 或 48px 行高 */
  size?: ListRowSize;
  /** 传了就整行渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替 `<a>`（路由库的链接组件）。传了就按链接处理 */
  render?: LinkRender;
  /** 传了（且没有 `href` 和 `render`）就整行渲染成按钮 */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
};

const sizeClass: Record<ListRowSize, string> = {
  sm: "min-h-10 py-2",
  md: "min-h-12 py-2.5",
};

/* 描边词不能比一行文字高，否则会把行撑开 */
const completedWordSize: Record<ListRowSize, string> = {
  sm: "text-lg",
  md: "text-xl",
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
  completed = false,
  completedWord = "DONE",
  size = "md",
  href,
  target,
  rel,
  render,
  onClick,
  disabled = false,
  className,
  children,
  ...props
}: ListRowProps) {
  const band = useContext(ListVariantContext) === "band";
  const isLink = href !== undefined || render !== undefined;
  const isButton = !isLink && onClick !== undefined;
  const interactive = (isLink || isButton) && !disabled;

  const rowClass = cn(
    "relative flex w-full items-center gap-3 px-4 text-left",
    sizeClass[size],
    // 完成：降低对比但保持可读
    completed && "text-ink-secondary",
    // 行带：选中靠整行换主题来表达（见下面的 data-theme），这里只管底和边线
    band && bandRow,
    selected &&
      !band &&
      "bg-surface-muted before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-action before:content-['']",
    interactive && [
      "transition-colors duration-(--duration-fast) ease-standard",
      !selected &&
        (band
          ? // 行带的底是实色，悬停换成提亮一档的实色；半透明的底会把画布透出来
            "hover:bg-surface-raised active:bg-surface-muted"
          : "hover:bg-ink/5 active:bg-ink/10"),
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
          {completed && <span className="sr-only">（已完成）</span>}
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
      {completed && completedWord !== null && (
        // 排在标题和行尾数值之间，不压在任何文字上；行很窄时让给标题
        <GhostText
          variant="outline"
          className={cn(
            "hidden shrink-0 leading-none @sm:block",
            completedWordSize[size],
          )}
        >
          {completedWord}
        </GhostText>
      )}
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
      <LinkElement
        render={render}
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
      </LinkElement>
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
      // 行带是一块固定的深色，选中的那一行反过来是固定的浅色：
      // 整行换主题，里面的次要文字、焦点环跟着取值
      data-theme={band ? (selected ? "light" : "dark") : undefined}
      {...props}
      data-selected={selected ? "" : undefined}
      data-completed={completed ? "" : undefined}
      className={cn("@container", className)}
    >
      {row}
    </li>
  );
}
