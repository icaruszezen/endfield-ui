import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { useOverflowing } from "../../hooks/useOverflowing";
import { TriangleRight } from "../../icons/TriangleRight";
import { cn } from "../../lib/cn";
import { focusRing, focusRingInset } from "../../lib/focus-ring";
import { mergeRefs } from "../../lib/merge-refs";

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

/** 能展开的行交给里面的展开钮 */
const RowContext = createContext<{
  expanded: boolean;
  toggle: () => void;
  detailId: string;
} | null>(null);

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
 * 要进详情把名称写成链接，要勾选在第一列放 `Checkbox`，要展开明细给行传 `detail`、
 * 在格子里放 `TableExpander`。
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

  // 展开的明细要钉在容器看得见的那一段里，它得知道这一段有多宽
  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const write = () =>
      node.style.setProperty("--table-viewport", `${node.clientWidth}px`);
    write();
    const observer = new ResizeObserver(write);
    observer.observe(node);
    return () => observer.disconnect();
  }, [scrollerRef]);
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

/*
 * 每隔五行加重一条线。只数主行：展开的明细也是一个 <tr>，不能让它把数数错。
 * 第五行自己展开着的时候，它的下边线没有了，加重的那条画在它的明细下面
 */
const ruledLines = [
  "[&>tr:nth-child(5n_of_:not([data-detail])):not([data-expanded])>*]:border-line-strong",
  "[&>tr:nth-child(5n_of_:not([data-detail]))+tr[data-detail]>*]:border-line-strong",
].join(" ");

export function TableBody({ className, ...props }: TableBodyProps) {
  const { ruled } = useContext(TableContext);
  return (
    <SectionContext value="body">
      <tbody {...props} className={cn(ruled && ruledLines, className)} />
    </SectionContext>
  );
}

export type TableRowProps = ComponentProps<"tr"> & {
  /** 选中：浅灰底 + 左缘黄条，输出 `aria-selected`。只用在表身的行上 */
  selected?: boolean;
  /**
   * 这一行的明细。传了这一行就能展开：展开时它出现在这一行下面，通栏。
   * 展开钮自己放：在某一格里放一个 `TableExpander`
   */
  detail?: ReactNode;
  /** 受控的展开状态 */
  expanded?: boolean;
  /** 非受控时一开始是不是展开的 */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
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

export function TableRow({
  selected,
  detail,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  className,
  ref,
  children,
  ...props
}: TableRowProps) {
  const section = useContext(SectionContext);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const detailId = useId();
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const expandable =
    detail !== undefined && detail !== null && detail !== false;
  const open = expandable && expanded;

  const context = useMemo(
    () =>
      expandable
        ? { expanded: open, toggle: () => setExpanded(!open), detailId }
        : null,
    [expandable, open, setExpanded, detailId],
  );

  if (section === "head") {
    return (
      <tr {...props} ref={ref} className={className}>
        {children}
      </tr>
    );
  }

  return (
    <>
      <tr
        {...props}
        ref={mergeRefs(rowRef, ref)}
        aria-selected={selected}
        data-selected={selected ? "" : undefined}
        data-expanded={open ? "" : undefined}
        className={cn(
          "group/row transition-colors duration-(--duration-fast) ease-standard",
          selected ? rowSelected : rowIdle,
          // 展开着：它和下面的明细是一块，中间不画线
          "[&[data-expanded]>*]:border-b-transparent",
          className,
        )}
      >
        <RowContext value={context}>{children}</RowContext>
      </tr>
      {open && (
        <DetailRow
          id={detailId}
          rowRef={rowRef}
          estimate={countCells(children)}
        >
          {detail}
        </DetailRow>
      )}
    </>
  );
}

/** 这一行占了几列：按子元素估。包了一层的、条件渲染的估不准，挂上之后再按 DOM 校正 */
function countCells(children: ReactNode) {
  let total = 0;
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ colSpan?: number }>(child)) continue;
    total += Number(child.props.colSpan ?? 1);
  }
  return Math.max(total, 1);
}

function DetailRow({
  id,
  rowRef,
  estimate,
  children,
}: {
  id: string;
  rowRef: RefObject<HTMLTableRowElement | null>;
  estimate: number;
  children: ReactNode;
}) {
  const [measured, setMeasured] = useState<number | null>(null);

  // 每次渲染都重新数：列是使用方的，随时可能多一列少一列
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let total = 0;
    for (const cell of row.cells) total += cell.colSpan;
    if (total > 0) setMeasured(total);
  });

  return (
    <tr id={id} data-detail="">
      <td
        colSpan={measured ?? estimate}
        className="border-b border-line bg-surface-sunken p-0 [tr:last-child>&]:border-b-0"
      >
        {/* 表格横向滚动时明细不跟着滚走：钉在容器的左缘，宽度是容器看得见的那一段 */}
        <div className="sticky left-0 w-[var(--table-viewport,100%)] px-4 py-3 text-sm whitespace-normal">
          {children}
        </div>
      </td>
    </tr>
  );
}

export type TableExpanderProps = Omit<
  ComponentProps<"button">,
  "aria-expanded" | "aria-controls" | "children"
>;

/**
 * 展开钮：放在能展开的行（传了 `detail` 的 `TableRow`）的某一格里，通常在名称前面。
 * 一张表里有很多个，名称写成"TR-2041 的明细"读屏才分得清。放在不能展开的行里不渲染。
 */
export function TableExpander({
  "aria-label": label = "明细",
  type = "button",
  className,
  onClick,
  ...props
}: TableExpanderProps) {
  const row = useContext(RowContext);
  if (!row) return null;

  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      aria-expanded={row.expanded}
      aria-controls={row.expanded ? row.detailId : undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) row.toggle();
      }}
      className={cn(
        "relative inline-flex size-6 shrink-0 items-center justify-center align-middle text-ink-secondary",
        // 24px 小于触屏的最小点击区，用伪元素向外补到 40px
        "after:absolute after:-inset-2 after:content-['']",
        "transition-colors duration-(--duration-fast) ease-standard",
        "hover:bg-ink/5 hover:text-ink",
        focusRing,
        className,
      )}
    >
      <TriangleRight
        size={8}
        className={cn(
          "transition-transform duration-(--duration-fast) ease-standard",
          row.expanded && "rotate-90",
        )}
      />
    </button>
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
