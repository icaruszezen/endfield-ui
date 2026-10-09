import { createContext, useContext, useMemo, type ComponentProps } from "react";
import { useOverflowing } from "../../hooks/useOverflowing";
import { TriangleRight } from "../../icons/TriangleRight";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";

export type TableHeaderVariant = "band" | "muted";
export type TableSize = "sm" | "md";
export type TableSortDirection = "ascending" | "descending";
export type TableAlign = "start" | "center" | "end";

type TableContextValue = {
  headerVariant: TableHeaderVariant;
  size: TableSize;
  sticky: boolean;
  stickyHeader: boolean;
  ruled: boolean;
};

const TableContext = createContext<TableContextValue>({
  headerVariant: "band",
  size: "md",
  sticky: false,
  stickyHeader: false,
  ruled: false,
});

/** 单元格要知道自己在表头里还是表身里 */
const SectionContext = createContext<"head" | "body">("body");

export type TableProps = Omit<ComponentProps<"table">, "aria-label"> & {
  /** 表格的名称。横向能滚动时，滚动的那一块也用它 */
  label: string;
  /**
   * 表头的画法：
   * - `band` 反转的标题带（亮色下墨底白字），默认，和面板的标题带是同一个样子。
   *   表头是一个 `data-theme="inverse"` 的局部主题，里面可以照常放复选框；
   * - `muted` 浅灰底墨字，页面上已经有很多深色块时用。
   */
  headerVariant?: TableHeaderVariant;
  /** 行高 36 / 44px，默认 `md` */
  size?: TableSize;
  /** 横向滚动时冻结第一列。列多、窄屏上要滚着看时打开 */
  stickyFirstColumn?: boolean;
  /**
   * 表身在容器里纵向滚动时，表头留在容器的上沿。
   * 容器要有一个高度上限才滚得起来：`className="max-h-96"`
   */
  stickyHeader?: boolean;
  /** 每隔五行加重一条线。行数很多时帮眼睛数行 */
  ruled?: boolean;
  /** 给外面那层横向滚动的容器；其余属性给 `<table>` */
  className?: string;
};

/**
 * 表格：原生 `<table>` 套样式。里面放 `TableHead`、`TableBody`、`TableRow`、
 * `TableHeaderCell`、`TableCell`。
 *
 * 放不下时在自己的容器里横向滚动，不撑破页面；给容器一个高度上限，它也能纵向滚动。整行不可点：
 * 要进详情把名称写成链接，要勾选在第一列放 `Checkbox`。
 */
export function Table({
  label,
  headerVariant = "band",
  size = "md",
  stickyFirstColumn = false,
  stickyHeader = false,
  ruled = false,
  className,
  ...props
}: TableProps) {
  const [scrollerRef, overflowing] = useOverflowing();
  const scrollable = overflowing.x || overflowing.y;
  const context = useMemo(
    () => ({
      headerVariant,
      size,
      sticky: stickyFirstColumn,
      stickyHeader,
      ruled,
    }),
    [headerVariant, size, stickyFirstColumn, stickyHeader, ruled],
  );

  return (
    <TableContext value={context}>
      <div
        ref={scrollerRef}
        // 冻结列右缘的那条线只看横向
        data-overflowing={overflowing.x ? "" : undefined}
        // 只有真的能滚动时才是一个能聚焦的区域：键盘要能滚它，
        // 但不溢出的时候不该白占一个 Tab 停靠点
        {...(scrollable && {
          role: "region",
          "aria-label": label,
          tabIndex: 0,
        })}
        className={cn(
          // 冻结列的底要知道表格压在什么颜色上；压在别的底色上时用 className 改这个变量
          "group/table isolate overflow-auto [--table-surface:var(--ef-surface)]",
          focusRingInset,
          className,
        )}
      >
        <table
          {...props}
          aria-label={label}
          data-size={size}
          data-header-variant={headerVariant}
          // 不用 border-collapse：合并的边线不跟着冻结的单元格走
          className="w-full border-separate border-spacing-0 text-left text-sm text-ink"
        />
      </div>
    </TableContext>
  );
}

export type TableHeadProps = ComponentProps<"thead">;

export function TableHead(props: TableHeadProps) {
  const { headerVariant } = useContext(TableContext);
  return (
    <SectionContext value="head">
      <thead
        // 反转的标题带整个换成反转主题：列头的焦点环、排序的三角、
        // 放在里面的复选框都按这条带子的底色取值
        data-theme={headerVariant === "band" ? "inverse" : undefined}
        {...props}
      />
    </SectionContext>
  );
}

export type TableBodyProps = ComponentProps<"tbody">;

export function TableBody({ className, ...props }: TableBodyProps) {
  const { ruled } = useContext(TableContext);
  return (
    <SectionContext value="body">
      <tbody
        {...props}
        className={cn(
          ruled && "[&>tr:nth-child(5n)>*]:border-line-strong",
          className,
        )}
      />
    </SectionContext>
  );
}

export type TableRowProps = ComponentProps<"tr"> & {
  /** 选中：浅灰底 + 左缘黄条，输出 `aria-selected`。只用在表身的行上 */
  selected?: boolean;
};

/*
 * 行的底色同时写进 --row-bg：冻结的那一格不能透明（滚过去的内容会透出来），
 * 它拿这个变量当底。悬停的那一档是"墨色 5% 混进表格的底"，
 * 看上去和其余单元格上那层半透明的悬停底一样。
 */
const rowIdle = [
  "[--row-bg:var(--table-surface)] hover:bg-ink/5",
  "hover:[--row-bg:color-mix(in_srgb,var(--ef-ink)_5%,var(--table-surface))]",
].join(" ");

const rowSelected = [
  "bg-surface-muted [--row-bg:var(--ef-surface-muted)]",
  "[&>*:first-child]:shadow-[inset_4px_0_0_var(--ef-action)]",
].join(" ");

export function TableRow({ selected, className, ...props }: TableRowProps) {
  const section = useContext(SectionContext);
  if (section === "head") return <tr {...props} className={className} />;

  return (
    <tr
      {...props}
      aria-selected={selected}
      data-selected={selected ? "" : undefined}
      className={cn(
        "group/row transition-colors duration-(--duration-fast) ease-standard",
        selected ? rowSelected : rowIdle,
        className,
      )}
    />
  );
}

const alignClass: Record<TableAlign, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

const cellPadding = "px-3 first:pl-4 last:pr-4";

/* 冻结的第一列 */
const stickyCell = "first:sticky first:left-0 first:z-1";

/*
 * 吸顶的表头。左上角那一格同时属于冻结的列和吸顶的行，要压在两者之上：
 * 表身的冻结格在文档里排在后面，层级相同时会盖住它
 */
const stickyHead = "sticky top-0 z-1";
const stickyCorner = "first:z-2";

/* `band` 的 surface 是反转主题里的 surface，也就是页面的反转色 */
const headerFill: Record<TableHeaderVariant, string> = {
  band: "bg-surface text-ink",
  muted: "bg-surface-muted text-ink",
};

export type TableHeaderCellProps = Omit<ComponentProps<"th">, "align"> & {
  /** 数字列：右对齐 */
  numeric?: boolean;
  /** 对齐，默认靠左；`numeric` 时默认靠右 */
  align?: TableAlign;
  /** 这一列现在的排序方向。没按它排就不传 */
  sort?: TableSortDirection | null;
  /**
   * 传了这一列就能排序：列名变成一个按钮，右侧一个小三角。
   * 拿到的是点了之后该换成的方向——没排或降序时是升序，升序时是降序
   */
  onSort?: (next: TableSortDirection) => void;
};

/** 列头：`<th scope="col">`。 */
export function TableHeaderCell({
  numeric = false,
  align = numeric ? "end" : "start",
  sort,
  onSort,
  className,
  children,
  ...props
}: TableHeaderCellProps) {
  const { headerVariant, sticky, stickyHeader } = useContext(TableContext);

  return (
    <th
      scope="col"
      {...props}
      aria-sort={sort ?? undefined}
      className={cn(
        "h-8 font-medium whitespace-nowrap",
        headerFill[headerVariant],
        alignClass[align],
        // 能排序的列，内边距让给里面的按钮：整格都能点
        onSort ? "p-0" : cellPadding,
        sticky && stickyCell,
        stickyHeader && [stickyHead, sticky && stickyCorner],
        className,
      )}
    >
      {onSort ? (
        <button
          type="button"
          onClick={() =>
            onSort(sort === "ascending" ? "descending" : "ascending")
          }
          className={cn(
            "group/sort flex h-8 w-full items-center gap-1.5 font-medium",
            // 数字列的三角放在左边：列名的右缘才能和下面的数字对齐
            align === "end" && "flex-row-reverse",
            align === "center" && "justify-center",
            // th 的 first: / last: 落不到按钮上，这里照着单元格的内边距再写一遍
            "px-3 [th:first-child>&]:pl-4 [th:last-child>&]:pr-4",
            focusRingInset,
          )}
        >
          {children}
          <TriangleRight
            size={8}
            className={cn(
              "shrink-0 transition-[opacity,rotate] duration-(--duration-fast) ease-standard",
              sort === "ascending" ? "-rotate-90" : "rotate-90",
              sort
                ? "text-accent-ink"
                : "opacity-40 group-hover/sort:opacity-100",
            )}
          />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

const cellHeight: Record<TableSize, string> = {
  sm: "h-9",
  md: "h-11",
};

export type TableCellProps = Omit<ComponentProps<"td">, "align"> & {
  /** 数字：右对齐、等宽 */
  numeric?: boolean;
  /** 对齐，默认靠左；`numeric` 时默认靠右 */
  align?: TableAlign;
  /** 这一格是这一行的名称：渲染成 `<th scope="row">` */
  rowHeader?: boolean;
  /**
   * 行内操作：鼠标悬停或键盘聚焦到这一行时才显示。
   * 触屏上没有悬停，所以常显
   */
  reveal?: boolean;
};

/** 单元格：`<td>`；`rowHeader` 时是 `<th scope="row">`。 */
export function TableCell({
  numeric = false,
  align = numeric ? "end" : "start",
  rowHeader = false,
  reveal = false,
  className,
  children,
  ...props
}: TableCellProps) {
  const { size, sticky } = useContext(TableContext);
  const Cell = rowHeader ? "th" : "td";

  return (
    <Cell
      {...(rowHeader && { scope: "row" })}
      {...props}
      className={cn(
        // 默认不折行：放不下就让表格横向滚动。要折行的长文字列自己加 whitespace-normal
        "border-b border-line py-1 whitespace-nowrap [tr:last-child>&]:border-b-0",
        cellHeight[size],
        cellPadding,
        alignClass[align],
        numeric && "font-tech tabular-nums",
        rowHeader && "font-medium",
        sticky && [
          stickyCell,
          "first:bg-(--row-bg)",
          // 溢出的时候右缘多一条线，看得出它下面压着东西
          "group-data-overflowing/table:first:border-r",
        ],
        className,
      )}
    >
      {reveal ? (
        <div
          className={cn(
            "inline-flex items-center gap-1 align-middle transition-opacity duration-(--duration-fast) ease-standard",
            // 有鼠标的设备上平时藏起来；这一行被悬停、或者焦点进了这一行就显示
            "[@media(hover:hover)]:opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100",
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </Cell>
  );
}
