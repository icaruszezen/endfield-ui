import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableProps,
  type TableSortDirection,
} from "./Table";

function Shipments({
  sort,
  onSort,
  selected,
  ...props
}: Partial<TableProps> & {
  sort?: TableSortDirection | null;
  onSort?: (next: TableSortDirection) => void;
  selected?: boolean;
}) {
  return (
    <Table label="运输批次" {...props}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>批次</TableHeaderCell>
          <TableHeaderCell numeric sort={sort} onSort={onSort}>
            件数
          </TableHeaderCell>
          <TableHeaderCell align="end">操作</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow selected={selected}>
          <TableCell rowHeader>TR-2041</TableCell>
          <TableCell numeric>12</TableCell>
          <TableCell reveal align="end">
            <button type="button">打印</button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell rowHeader>TR-2044</TableCell>
          <TableCell numeric>49</TableCell>
          <TableCell />
        </TableRow>
      </TableBody>
    </Table>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Table", () => {
  it("是一个有名称的原生表格：列头带 scope=col，行名带 scope=row", () => {
    render(<Shipments />);
    const table = screen.getByRole("table", { name: "运输批次" });
    expect(table.tagName).toBe("TABLE");

    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "批次",
      "件数",
      "操作",
    ]);
    for (const header of headers)
      expect(header).toHaveAttribute("scope", "col");

    const name = within(table).getByRole("rowheader", { name: "TR-2041" });
    expect(name.tagName).toBe("TH");
    expect(name).toHaveAttribute("scope", "row");
  });

  it("数字列右对齐、等宽；对齐也可以单独指定", () => {
    render(<Shipments />);
    const count = screen.getByRole("cell", { name: "12" });
    expect(count).toHaveClass("text-right", "font-tech", "tabular-nums");
    expect(screen.getByRole("columnheader", { name: "件数" })).toHaveClass(
      "text-right",
    );
    expect(screen.getByRole("columnheader", { name: "操作" })).toHaveClass(
      "text-right",
    );
    expect(screen.getByRole("columnheader", { name: "批次" })).toHaveClass(
      "text-left",
    );
  });

  it("className 给外面的滚动容器，其余属性给 table", () => {
    render(<Shipments className="max-w-80" data-testid="table" />);
    const table = screen.getByTestId("table");
    expect(table.tagName).toBe("TABLE");
    expect(table.parentElement).toHaveClass("max-w-80", "overflow-auto");
  });

  it("两种表头、两档行高", () => {
    const { rerender } = render(<Shipments />);
    expect(screen.getByRole("columnheader", { name: "批次" })).toHaveClass(
      "bg-surface-inverse",
      "text-ink-inverse",
    );
    expect(screen.getByRole("cell", { name: "12" })).toHaveClass("h-11");

    rerender(<Shipments headerVariant="muted" size="sm" />);
    expect(screen.getByRole("columnheader", { name: "批次" })).toHaveClass(
      "bg-surface-muted",
      "text-ink",
    );
    expect(screen.getByRole("cell", { name: "12" })).toHaveClass("h-9");
  });

  it("没传 onSort 的列头只是文字", () => {
    render(<Shipments />);
    expect(
      within(screen.getByRole("columnheader", { name: "件数" })).queryByRole(
        "button",
      ),
    ).not.toBeInTheDocument();
  });

  it("排序：列名是按钮，点了告诉你该换成哪个方向；aria-sort 只写在当前排序的列上", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    const { rerender } = render(<Shipments onSort={onSort} />);
    const header = screen.getByRole("columnheader", { name: "件数" });
    const button = within(header).getByRole("button", { name: "件数" });
    expect(header).not.toHaveAttribute("aria-sort");

    await user.click(button);
    expect(onSort).toHaveBeenLastCalledWith("ascending");

    rerender(<Shipments sort="ascending" onSort={onSort} />);
    expect(header).toHaveAttribute("aria-sort", "ascending");
    await user.click(button);
    expect(onSort).toHaveBeenLastCalledWith("descending");

    rerender(<Shipments sort="descending" onSort={onSort} />);
    expect(header).toHaveAttribute("aria-sort", "descending");
    await user.click(button);
    expect(onSort).toHaveBeenLastCalledWith("ascending");

    // 键盘也能排
    button.focus();
    await user.keyboard("{Enter}");
    expect(onSort).toHaveBeenCalledTimes(4);
  });

  it("排序的三角是装饰，不进列头的名称", () => {
    render(<Shipments sort="ascending" onSort={() => {}} />);
    const header = screen.getByRole("columnheader", { name: "件数" });
    expect(header.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("选中的行：浅灰底、输出 aria-selected；表头的行不受影响", () => {
    render(<Shipments selected />);
    const [headRow, first, second] = screen.getAllByRole("row");
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(first).toHaveAttribute("data-selected");
    expect(first).toHaveClass("bg-surface-muted");
    // 没声明 selected 的行不是"可选中"的
    expect(second).not.toHaveAttribute("aria-selected");
    expect(second).toHaveClass("hover:bg-ink/5");
    expect(headRow).not.toHaveClass("group/row");
  });

  it("行内操作包在一层里：有鼠标的设备上平时藏着，悬停或焦点进了这一行才显示", () => {
    render(<Shipments />);
    const wrapper = screen.getByRole("button", { name: "打印" }).parentElement!;
    expect(wrapper).toHaveClass(
      "[@media(hover:hover)]:opacity-0",
      "group-hover/row:opacity-100",
      "group-focus-within/row:opacity-100",
    );
    // 藏着的时候仍然在 Tab 序列里：聚焦到它，它就显示出来
    expect(screen.getByRole("button", { name: "打印" })).toBeVisible();
  });

  it("ruled：每隔五行加重一条线", () => {
    const { rerender } = render(<Shipments />);
    const body = screen.getAllByRole("rowgroup")[1]!;
    expect(body).not.toHaveClass("[&>tr:nth-child(5n)>*]:border-line-strong");
    rerender(<Shipments ruled />);
    expect(body).toHaveClass("[&>tr:nth-child(5n)>*]:border-line-strong");
  });

  it("stickyFirstColumn：每一行的第一格冻结，底不透明", () => {
    render(<Shipments stickyFirstColumn />);
    const name = screen.getByRole("rowheader", { name: "TR-2041" });
    expect(name).toHaveClass(
      "first:sticky",
      "first:left-0",
      "first:bg-(--row-bg)",
    );
    expect(screen.getByRole("columnheader", { name: "批次" })).toHaveClass(
      "first:sticky",
      "bg-surface-inverse",
    );
  });

  it("stickyHeader：列头吸在容器上沿；和冻结首列同开时左上角压在两者之上", () => {
    const { rerender } = render(<Shipments stickyHeader />);
    const first = () => screen.getByRole("columnheader", { name: "批次" });
    expect(first()).toHaveClass("sticky", "top-0", "z-1");
    expect(first()).not.toHaveClass("first:z-2");
    // 表身的格子不跟着吸
    expect(screen.getByRole("rowheader", { name: "TR-2041" })).not.toHaveClass(
      "top-0",
    );

    rerender(<Shipments stickyHeader stickyFirstColumn />);
    expect(first()).toHaveClass("sticky", "top-0", "first:left-0", "first:z-2");
  });

  it("纵向溢出时滚动容器同样是一个能聚焦的区域，但不算横向溢出", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(320);

    render(<Shipments stickyHeader />);
    const region = screen.getByRole("region", { name: "运输批次" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).not.toHaveAttribute("data-overflowing");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("不溢出时滚动容器不占 Tab 停靠点", () => {
    render(<Shipments data-testid="table" />);
    const scroller = screen.getByTestId("table").parentElement!;
    expect(scroller).not.toHaveAttribute("tabindex");
    expect(scroller).not.toHaveAttribute("role");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("横向溢出时滚动容器是一个有名称、能聚焦的区域", () => {
    // jsdom 不排版：假装内容比容器宽
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(640);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);

    render(<Shipments />);
    const region = screen.getByRole("region", { name: "运输批次" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveAttribute("data-overflowing");
    expect(within(region).getByRole("table")).toBeInTheDocument();
  });
});
