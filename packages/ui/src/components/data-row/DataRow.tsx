import {
  createContext,
  useContext,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { bandCanvas, bandGap, bandRow } from "../list/band-style";
import { Sparkline } from "../sparkline/Sparkline";

export type DataRowColumns = {
  /** 名称那一列的列名 */
  name: ReactNode;
  /** 走势列的列名。不给就没有这一列 */
  trend?: ReactNode;
  /** 当前值那一列的列名 */
  value: ReactNode;
  /** 参考值列的列名。不给就没有这一列 */
  reference?: ReactNode;
};

export type DataRowListProps = Omit<ComponentProps<"div">, "children"> & {
  /** 这张表的名称，读屏会读出来 */
  label?: string;
  /** 各列的列名；有没有走势列、参考值列也由它决定 */
  columns: DataRowColumns;
  /** `DataRow` */
  children: ReactNode;
};

type Layout = { trend: boolean; reference: boolean };

const LayoutContext = createContext<Layout>({ trend: false, reference: false });

/*
 * 列的模板。容器变窄时先收起走势列（@lg 以下），再收起参考值列（@sm 以下）；
 * 对应的单元格用 hidden 收起，模板跟着少一列。
 */
const NARROW = "grid-cols-[minmax(0,1fr)_auto]";
const columnsClass = (layout: Layout) =>
  cn(
    NARROW,
    layout.reference && "@sm:grid-cols-[minmax(0,1fr)_auto_auto]",
    layout.trend &&
      (layout.reference
        ? "@lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto]"
        : "@lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]"),
  );

const trendCell = "hidden @lg:block";
const referenceCell = "hidden @sm:block";

/* 每一行（连同列头）都是一个子网格：对齐到表格的那一组列 */
const rowGrid = "col-span-full grid grid-cols-subgrid items-center gap-x-4";

/*
 * 列名之间的短竖线画在单元格左边的缝里。截断写在里面那一层上：
 * 写在单元格自己身上的话，overflow 会把竖线一起裁掉。
 */
const headerCell =
  "relative min-w-0 not-first:before:absolute not-first:before:top-1/2 not-first:before:-left-2 not-first:before:h-3 not-first:before:w-px not-first:before:-translate-y-1/2 not-first:before:bg-line-strong not-first:before:content-['']";

function HeaderCell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span role="columnheader" className={cn(headerCell, className)}>
      <span className="block truncate">{children}</span>
    </span>
  );
}

/**
 * 数据行带：浅色画布上一条条深色的行，上面一条胶囊形的列头。
 * 语义是一张表格；里面只放 `DataRow`。
 */
export function DataRowList({
  label,
  columns,
  className,
  children,
  ...props
}: DataRowListProps) {
  const layout: Layout = {
    trend: columns.trend !== undefined,
    reference: columns.reference !== undefined,
  };

  return (
    <div
      {...props}
      className={cn("@container text-ink", bandCanvas, className)}
    >
      <div
        role="table"
        aria-label={label}
        className={cn("grid", bandGap, columnsClass(layout))}
      >
        <div
          role="row"
          className={cn(
            rowGrid,
            // 透明的边线：数据行有一圈 1px 的线，列头也占上这 1px，两边的文字才对得齐
            "min-h-6 rounded-full border border-transparent bg-surface-muted pr-3 pl-4 text-xs",
          )}
        >
          <HeaderCell>{columns.name}</HeaderCell>
          {layout.trend && (
            <HeaderCell className={trendCell}>{columns.trend}</HeaderCell>
          )}
          <HeaderCell className="text-right">{columns.value}</HeaderCell>
          {layout.reference && (
            <HeaderCell className={cn(referenceCell, "text-right")}>
              {columns.reference}
            </HeaderCell>
          )}
        </div>
        <LayoutContext value={layout}>{children}</LayoutContext>
      </div>
    </div>
  );
}

export type DataRowTone = "neutral" | "info" | "accent" | "danger";

export type DataRowProps = Omit<ComponentProps<"div">, "children"> & {
  /** 这一行的名称 */
  name: ReactNode;
  /**
   * 左缘的类目色条：一个 CSS 颜色值，通常传令牌变量（`var(--color-special)`）。
   * 不要用黄色——黄色是"选中"和"收藏"
   */
  categoryColor?: string;
  /** 收藏。只传它是一个静态的标记；同时传 `onFavoriteChange` 才是一个能点的切换按钮 */
  favorite?: boolean;
  onFavoriteChange?: (favorite: boolean) => void;
  /** 收藏按钮的可访问名称，默认"收藏" */
  favoriteLabel?: string;
  /** 走势：一串数值，画成行内的小型面积图。表头没有走势列时不显示 */
  series?: readonly number[];
  /** 当前值。正负号连同数值一起传：颜色之外还要有符号 */
  value: ReactNode;
  /**
   * 当前值的含义：
   * - `info` 产出、正向（蓝）；
   * - `accent` 消耗、关注（黄）；
   * - `danger` 超支、异常（红），走势图也跟着变红；
   * - `neutral` 不表态，默认。
   */
  tone?: DataRowTone;
  /** 参考值（理论值、上限）。表头没有参考值列时不显示 */
  reference?: ReactNode;
};

/* 行是局部暗色主题：这几档文字色按深色底取值，对比度都在 4.5:1 以上 */
const toneClass: Record<DataRowTone, string> = {
  neutral: "text-ink",
  info: "text-info",
  accent: "text-accent-ink",
  danger: "text-danger",
};

const favoriteDot = "block size-4 rounded-full";
const favoriteOn = "bg-action";
/* 未收藏是一个空心的圆环：形状也不同，不只靠颜色 */
const favoriteOff = "border-2 border-ink-tertiary";

/** 数据行带里的一行。放在 `DataRowList` 里。 */
export function DataRow({
  name,
  categoryColor,
  favorite,
  onFavoriteChange,
  favoriteLabel = "收藏",
  series,
  value,
  tone = "neutral",
  reference,
  className,
  style,
  ...props
}: DataRowProps) {
  const layout = useContext(LayoutContext);
  const hasFavorite = favorite !== undefined || onFavoriteChange !== undefined;
  const dotClass = cn(favoriteDot, favorite ? favoriteOn : favoriteOff);

  return (
    <div
      role="row"
      // 固定的深色：行里的文字、焦点环都按深色底取值
      data-theme="dark"
      data-tone={tone}
      data-favorite={favorite ? "" : undefined}
      {...props}
      style={
        categoryColor
          ? ({
              "--data-row-category": categoryColor,
              ...style,
            } as CSSProperties)
          : style
      }
      className={cn(rowGrid, bandRow, "relative min-h-11 pr-3 pl-4", className)}
    >
      {categoryColor && (
        <span
          aria-hidden="true"
          data-category=""
          className="absolute inset-y-0 left-0 w-1 bg-(--data-row-category)"
        />
      )}

      <div role="rowheader" className="flex min-w-0 items-center gap-2.5">
        {hasFavorite &&
          (onFavoriteChange ? (
            <button
              type="button"
              aria-label={favoriteLabel}
              aria-pressed={favorite ?? false}
              onClick={() => onFavoriteChange(!favorite)}
              // 圆只有 16px，点击区用伪元素向外补到 36px
              className={cn(
                "relative shrink-0 rounded-full after:absolute after:-inset-2.5 after:content-['']",
                focusRing,
              )}
            >
              <span className={dotClass} />
            </button>
          ) : (
            <span aria-hidden="true" className={cn(dotClass, "shrink-0")} />
          ))}
        <span className="min-w-0 truncate">
          {name}
          {favorite && !onFavoriteChange && (
            <span className="sr-only">（已收藏）</span>
          )}
        </span>
      </div>

      {layout.trend && (
        <div role="cell" className={cn(trendCell, "h-8")}>
          {series && (
            <Sparkline
              data={series}
              // 量值图表归蓝；只有这一行异常时换成红
              tone={tone === "danger" ? "danger" : "info"}
              className="h-full"
            />
          )}
        </div>
      )}

      <div
        role="cell"
        className={cn(
          "text-right font-tech font-bold whitespace-nowrap tabular-nums",
          toneClass[tone],
        )}
      >
        {value}
      </div>

      {layout.reference && (
        <div
          role="cell"
          className={cn(
            referenceCell,
            "text-right font-tech whitespace-nowrap text-ink-secondary tabular-nums",
          )}
        >
          {reference}
        </div>
      )}
    </div>
  );
}
