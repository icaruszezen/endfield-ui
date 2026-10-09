import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Table,
  TableBody,
  TableCell,
  TableExpander,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableProps,
  type TableRowProps,
  type TableSortDirection,
} from "./Table";

/* 两行都能展开；第二行的名称占两列，看通栏的列数是不是照实数的 */
function Expandable({
  first,
  ruled,
}: {
  first?: Partial<TableRowProps>;
  ruled?: boolean;
}) {
  return (
    <Table label="运输批次" ruled={ruled}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>批次</TableHeaderCell>
          <TableHeaderCell>物资</TableHeaderCell>
          <TableHeaderCell numeric>件数</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow detail={<p>滤芯 12 件，分两箱</p>} {...first}>
          <TableCell rowHeader>
            <TableExpander aria-label="TR-2041 的明细" />
            TR-2041
          </TableCell>
          <TableCell>滤芯</TableCell>
          <TableCell numeric>12</TableCell>
        </TableRow>
        <TableRow detail={<p>信标 49 件</p>}>
          <TableCell rowHeader colSpan={2}>
            <TableExpander />
            TR-2044
          </TableCell>
          <TableCell numeric>49</TableCell>
        </TableRow>
        <TableRow>
          <TableCell rowHeader>
            <TableExpander aria-label="不该出现" />
            TR-2050
          </TableCell>
          <TableCell>电池</TableCell>
          <TableCell numeric>8</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

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
    const head = () => screen.getAllByRole("rowgroup")[0]!;
    // 反转的标题带是一个反转主题：里面用的就是普通的 surface / ink
    expect(head()).toHaveAttribute("data-theme", "inverse");
    expect(screen.getByRole("columnheader", { name: "批次" })).toHaveClass(
      "bg-surface",
      "text-ink",
    );
    expect(screen.getByRole("cell", { name: "12" })).toHaveClass("h-11");

    rerender(<Shipments headerVariant="muted" size="sm" />);
    expect(head()).not.toHaveAttribute("data-theme");
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
    // 只数主行：展开的明细也是一个 <tr>，不能把它算进去
    const everyFifth =
      "[&>tr:nth-child(5n_of_:not([data-detail])):not([data-expanded])>*]:border-line-strong";
    expect(body).not.toHaveClass(everyFifth);
    rerender(<Shipments ruled />);
    expect(body).toHaveClass(everyFifth);
    // 第五行展开着：加重的线画在它的明细下面
    expect(body).toHaveClass(
      "[&>tr:nth-child(5n_of_:not([data-detail]))+tr[data-detail]>*]:border-line-strong",
    );
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
      "bg-surface",
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

  it("行展开：展开钮说得清开没开；展开时多出一行通栏的明细，收起时它不在页面里", async () => {
    const user = userEvent.setup();
    render(<Expandable />);
    const toggle = screen.getByRole("button", { name: "TR-2041 的明细" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).not.toHaveAttribute("aria-controls");
    expect(screen.queryByText("滤芯 12 件，分两箱")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const detail = screen.getByText("滤芯 12 件，分两箱").closest("tr")!;
    expect(detail).toHaveAttribute("data-detail");
    expect(toggle).toHaveAttribute("aria-controls", detail.id);
    // 明细紧跟在它的主行后面，一个通栏的单元格
    const row = toggle.closest("tr")!;
    expect(row).toHaveAttribute("data-expanded");
    expect(row.nextElementSibling).toBe(detail);
    expect(detail.cells).toHaveLength(1);
    expect(detail.cells[0]).toHaveAttribute("colspan", "3");

    // 键盘也能收起来
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("滤芯 12 件，分两箱")).not.toBeInTheDocument();
    expect(row).not.toHaveAttribute("data-expanded");
  });

  it("行展开：通栏的列数按主行各格的 colSpan 加起来", async () => {
    const user = userEvent.setup();
    render(<Expandable />);
    await user.click(screen.getByRole("button", { name: "明细" }));
    const detail = screen.getByText("信标 49 件").closest("tr")!;
    expect(detail.cells[0]).toHaveAttribute("colspan", "3");
  });

  it("行展开：没传 detail 的行里，展开钮不渲染", () => {
    render(<Expandable />);
    expect(
      screen.queryByRole("button", { name: "不该出现" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: "TR-2050" }),
    ).toBeInTheDocument();
  });

  it("行展开：defaultExpanded 一开始就开着；各行各记各的", async () => {
    const user = userEvent.setup();
    render(<Expandable first={{ defaultExpanded: true }} />);
    expect(screen.getByText("滤芯 12 件，分两箱")).toBeInTheDocument();
    expect(screen.queryByText("信标 49 件")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "明细" }));
    expect(screen.getByText("滤芯 12 件，分两箱")).toBeInTheDocument();
    expect(screen.getByText("信标 49 件")).toBeInTheDocument();
  });

  it("行展开：受控时只报告，开不开看传进来的值", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <Expandable first={{ expanded: false, onExpandedChange }} />,
    );
    const toggle = screen.getByRole("button", { name: "TR-2041 的明细" });
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    rerender(<Expandable first={{ expanded: true, onExpandedChange }} />);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
  });

  it("行展开：其余属性和 ref 仍然给主行；展开着的主行不画下边线", () => {
    const ref = { current: null as HTMLTableRowElement | null };
    render(
      <Expandable
        first={{ defaultExpanded: true, ref, id: "row-2041", selected: true }}
      />,
    );
    const row = screen.getByRole("rowheader", {
      name: /TR-2041/,
    }).parentElement!;
    expect(ref.current).toBe(row);
    expect(row).toHaveAttribute("id", "row-2041");
    expect(row).toHaveAttribute("aria-selected", "true");
    expect(row).toHaveClass("[&[data-expanded]>*]:border-b-transparent");
    // 明细那一行不算选中，也没有悬停底
    const detail = row.nextElementSibling!;
    expect(detail).not.toHaveAttribute("aria-selected");
    expect(detail).not.toHaveClass("group/row");
  });

  it("展开钮的三角是装饰；点击可以被拦下", async () => {
    const user = userEvent.setup();
    render(
      <Table label="运输批次">
        <TableBody>
          <TableRow detail="明细内容">
            <TableCell>
              <TableExpander onClick={(event) => event.preventDefault()} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const toggle = screen.getByRole("button", { name: "明细" });
    expect(toggle.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
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
