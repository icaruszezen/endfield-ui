import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Calendar,
  type CalendarRangeProps,
  type CalendarSingleProps,
  type DateRange,
} from "./Calendar";

/** 固定"今天"：2026-10-09，星期五 */
function October(props: CalendarSingleProps) {
  return <Calendar today="2026-10-09" {...props} />;
}

/** 选一段的月历，同一个"今天" */
function OctoberRange(props: Omit<CalendarRangeProps, "range">) {
  return <Calendar range today="2026-10-09" {...props} />;
}

const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)!;
const title = () => screen.getByText(/^\d{4}年\d{1,2}月$/);
const tabStops = () =>
  [...document.querySelectorAll("[data-date]")].filter(
    (button) => button.getAttribute("tabindex") === "0",
  );

describe("Calendar", () => {
  it("是一张以月份命名的网格：一行星期，六行日期", () => {
    render(<October />);
    const grid = screen.getByRole("grid", { name: "2026年10月" });
    const headers = within(grid).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
      "日",
    ]);
    expect(headers[0]).toHaveAttribute("abbr", "星期一");
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(42);
  });

  it("每个日子是一个按钮，名称是完整的日期", () => {
    render(<October />);
    expect(screen.getByRole("button", { name: "2026年10月9日星期五" })).toBe(
      day("2026-10-09"),
    );
    expect(day("2026-10-09")).toHaveTextContent(/^9$/);
  });

  it("今天带 aria-current=date；不在本月的日子标出来", () => {
    render(<October />);
    expect(day("2026-10-09")).toHaveAttribute("aria-current", "date");
    expect(day("2026-10-10")).not.toHaveAttribute("aria-current");
    expect(day("2026-09-30")).toHaveAttribute("data-outside");
    expect(day("2026-10-01")).not.toHaveAttribute("data-outside");
  });

  it("点一天选中它：那一格带 aria-selected，并通知 onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<October onValueChange={onValueChange} />);
    await user.click(day("2026-10-15"));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-15");
    expect(day("2026-10-15").closest("[role=gridcell]")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(day("2026-10-09").closest("[role=gridcell]")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("整个网格只占一个 Tab 停靠点：选中的那一天，没选时是今天", () => {
    const { rerender } = render(<October />);
    expect(tabStops()).toEqual([day("2026-10-09")]);
    rerender(<October key="selected" defaultValue="2026-10-20" />);
    expect(tabStops()).toEqual([day("2026-10-20")]);
  });

  it("默认显示选中那一天所在的月份", () => {
    render(<October defaultValue="2027-02-14" />);
    expect(title()).toHaveTextContent("2027年2月");
    expect(day("2027-02-14")).toBeInTheDocument();
  });

  it("翻月钮换月份，标题会播报；停靠点跟到新的月份里", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<October onMonthChange={onMonthChange} />);
    expect(title()).toHaveAttribute("aria-live", "polite");

    await user.click(screen.getByRole("button", { name: "下个月" }));
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-11");
    expect(title()).toHaveTextContent("2026年11月");
    expect(tabStops()).toEqual([day("2026-11-09")]);

    await user.click(screen.getByRole("button", { name: "上个月" }));
    await user.click(screen.getByRole("button", { name: "上个月" }));
    expect(title()).toHaveTextContent("2026年9月");
  });

  it("键盘：方向键走一天 / 一周，Home / End 到这一周的头尾", async () => {
    const user = userEvent.setup();
    render(<October />);
    day("2026-10-09").focus();
    await user.keyboard("{ArrowRight}");
    expect(day("2026-10-10")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(day("2026-10-17")).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(day("2026-10-15")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(day("2026-10-08")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(day("2026-10-05")).toHaveFocus();
    await user.keyboard("{End}");
    expect(day("2026-10-11")).toHaveFocus();
    expect(tabStops()).toEqual([day("2026-10-11")]);
  });

  it("键盘：走出这个月时月历跟着翻；PageDown 换月，加 Shift 换年", async () => {
    const user = userEvent.setup();
    render(<October defaultValue="2026-10-31" />);
    day("2026-10-31").focus();
    await user.keyboard("{ArrowRight}");
    expect(title()).toHaveTextContent("2026年11月");
    expect(day("2026-11-01")).toHaveFocus();

    await user.keyboard("{PageDown}");
    expect(title()).toHaveTextContent("2026年12月");
    expect(day("2026-12-01")).toHaveFocus();
    await user.keyboard("{PageUp}{PageUp}");
    expect(title()).toHaveTextContent("2026年10月");

    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(title()).toHaveTextContent("2027年10月");
    expect(day("2027-10-01")).toHaveFocus();
  });

  it("PageDown 遇到没有这一天的月份：落在月末", async () => {
    const user = userEvent.setup();
    render(<October defaultValue="2026-01-31" />);
    day("2026-01-31").focus();
    await user.keyboard("{PageDown}");
    expect(day("2026-02-28")).toHaveFocus();
  });

  it("回车和空格选中焦点所在的那一天", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<October onValueChange={onValueChange} />);
    day("2026-10-09").focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-10");
    await user.keyboard("{ArrowRight} ");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-11");
  });

  it("min / max 之外的日子选不了；键盘走到范围外被夹回边界", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <October
        min="2026-10-05"
        max="2026-10-20"
        onValueChange={onValueChange}
      />,
    );
    expect(day("2026-10-04")).toHaveAttribute("aria-disabled", "true");
    expect(day("2026-10-05")).not.toHaveAttribute("aria-disabled");
    await user.click(day("2026-10-04"));
    expect(onValueChange).not.toHaveBeenCalled();

    day("2026-10-09").focus();
    await user.keyboard("{PageUp}");
    expect(day("2026-10-05")).toHaveFocus();
    await user.keyboard("{PageDown}");
    expect(day("2026-10-20")).toHaveFocus();
    expect(title()).toHaveTextContent("2026年10月");
  });

  it("整个月都在范围外时，对应的翻月钮禁用", () => {
    render(<October min="2026-10-01" max="2026-11-15" />);
    expect(screen.getByRole("button", { name: "上个月" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "下个月" })).toBeEnabled();
  });

  it("isDateDisabled：不可选的日子走得到、选不了", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <October
        // 周末不可选
        isDateDisabled={(date) =>
          [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay())
        }
        onValueChange={onValueChange}
      />,
    );
    expect(day("2026-10-10")).toHaveAttribute("aria-disabled", "true");
    day("2026-10-09").focus();
    await user.keyboard("{ArrowRight}");
    expect(day("2026-10-10")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("点不在本月的日子：选中它，月历翻到那个月", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<October onValueChange={onValueChange} />);
    await user.click(day("2026-11-03"));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-03");
    expect(title()).toHaveTextContent("2026年11月");
  });

  it("受控：值和月份都由外面决定", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>("2026-10-09");
      return (
        <>
          <October value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue("2027-03-08")}>
            跳到明年三月
          </button>
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(day("2026-10-12"));
    expect(screen.getByRole("status")).toHaveTextContent("2026-10-12");

    await user.click(screen.getByRole("button", { name: "跳到明年三月" }));
    expect(title()).toHaveTextContent("2027年3月");
    expect(tabStops()).toEqual([day("2027-03-08")]);
  });

  it("weekStartsOn={0}：一周从星期日开始", () => {
    render(<October weekStartsOn={0} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]).toHaveTextContent("日");
    expect(headers[6]).toHaveTextContent("六");
  });

  it("locale 换语言：标题、星期和日期名称跟着换", () => {
    render(<October locale="en-US" />);
    expect(
      screen.getByRole("grid", { name: "October 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Friday, October 9, 2026" }),
    ).toBe(day("2026-10-09"));
  });
});

describe("Calendar · 选一段", () => {
  const cell = (date: string) => day(date).closest("[role=gridcell]")!;
  const selected = () =>
    [...document.querySelectorAll("[role=gridcell][aria-selected=true]")].map(
      (node) => node.querySelector("[data-date]")!.getAttribute("data-date"),
    );

  it("网格标成可以多选；没选时一格都不带 aria-selected", () => {
    render(<OctoberRange />);
    expect(screen.getByRole("grid")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    expect(selected()).toEqual([]);
  });

  it("有值时：两端是实心的块，中间是连着的浅带，都带 aria-selected", () => {
    render(<OctoberRange defaultValue={["2026-10-13", "2026-10-16"]} />);
    expect(selected()).toEqual([
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
    ]);
    expect(day("2026-10-13")).toHaveAttribute("data-range-start");
    expect(day("2026-10-16")).toHaveAttribute("data-range-end");
    expect(day("2026-10-13")).toHaveClass("bg-surface-inverse");
    expect(day("2026-10-16")).toHaveClass("bg-surface-inverse");
    expect(day("2026-10-14")).toHaveAttribute("data-in-range");
    expect(day("2026-10-14")).toHaveClass("bg-ink/10");
    expect(day("2026-10-14")).not.toHaveClass("bg-surface-inverse");
    expect(day("2026-10-17")).not.toHaveAttribute("data-in-range");
  });

  it("两端的名称后面带「起始日」「结束日」；可以换", () => {
    const { rerender } = render(
      <OctoberRange defaultValue={["2026-10-13", "2026-10-16"]} />,
    );
    expect(day("2026-10-13")).toHaveAttribute(
      "aria-label",
      "2026年10月13日星期二，起始日",
    );
    expect(day("2026-10-16")).toHaveAttribute(
      "aria-label",
      "2026年10月16日星期五，结束日",
    );
    expect(day("2026-10-14")).toHaveAttribute(
      "aria-label",
      "2026年10月14日星期三",
    );
    rerender(
      <OctoberRange
        value={["2026-10-13", "2026-10-16"]}
        startLabel="出发"
        endLabel="返回"
      />,
    );
    expect(day("2026-10-13")).toHaveAttribute(
      "aria-label",
      "2026年10月13日星期二，出发",
    );
    expect(day("2026-10-16")).toHaveAttribute(
      "aria-label",
      "2026年10月16日星期五，返回",
    );
  });

  it("点两下选完：第一下不通知，第二下才通知", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<OctoberRange onValueChange={onValueChange} />);

    await user.click(day("2026-10-13"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(day("2026-10-13")).toHaveAttribute("data-range-start");
    expect(selected()).toEqual(["2026-10-13"]);

    await user.click(day("2026-10-16"));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith([
      "2026-10-13",
      "2026-10-16",
    ]);
    expect(selected()).toHaveLength(4);
  });

  it("后点的那天更早：自动排成先后", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<OctoberRange onValueChange={onValueChange} />);
    await user.click(day("2026-10-16"));
    await user.click(day("2026-10-13"));
    expect(onValueChange).toHaveBeenLastCalledWith([
      "2026-10-13",
      "2026-10-16",
    ]);
    expect(day("2026-10-13")).toHaveAttribute("data-range-start");
    expect(day("2026-10-16")).toHaveAttribute("data-range-end");
  });

  it("同一天点两下：只有一天的一段，这一天既是起始也是结束", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<OctoberRange onValueChange={onValueChange} />);
    await user.click(day("2026-10-13"));
    await user.click(day("2026-10-13"));
    expect(onValueChange).toHaveBeenLastCalledWith([
      "2026-10-13",
      "2026-10-13",
    ]);
    expect(day("2026-10-13")).toHaveAttribute(
      "aria-label",
      "2026年10月13日星期二，起始日，结束日",
    );
  });

  it("选完之后再点是重新开始：原来那一段先让开", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <OctoberRange
        defaultValue={["2026-10-13", "2026-10-16"]}
        onValueChange={onValueChange}
      />,
    );
    await user.click(day("2026-10-20"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(selected()).toEqual(["2026-10-20"]);
    expect(day("2026-10-14")).not.toHaveAttribute("data-in-range");

    await user.click(day("2026-10-22"));
    expect(onValueChange).toHaveBeenLastCalledWith([
      "2026-10-20",
      "2026-10-22",
    ]);
  });

  it("起始日定了之后：到指针所在那天之间是预览带；指针离开网格就收回来", async () => {
    const user = userEvent.setup();
    render(<OctoberRange />);
    await user.click(day("2026-10-13"));
    await user.hover(day("2026-10-16"));
    expect(day("2026-10-14")).toHaveAttribute("data-preview");
    expect(day("2026-10-16")).toHaveAttribute("data-preview");
    expect(day("2026-10-16")).toHaveClass("bg-ink/5");
    expect(day("2026-10-17")).not.toHaveAttribute("data-preview");
    // 起始日自己是实心的块，不算预览
    expect(day("2026-10-13")).not.toHaveAttribute("data-preview");

    // 往回指也有
    await user.hover(day("2026-10-08"));
    expect(day("2026-10-10")).toHaveAttribute("data-preview");
    expect(day("2026-10-14")).not.toHaveAttribute("data-preview");

    await user.hover(screen.getByRole("button", { name: "下个月" }));
    expect(document.querySelector("[data-preview]")).toBeNull();
  });

  it("没定起始日的时候，指针划过不出预览", async () => {
    const user = userEvent.setup();
    render(<OctoberRange defaultValue={["2026-10-13", "2026-10-16"]} />);
    await user.hover(day("2026-10-22"));
    expect(document.querySelector("[data-preview]")).toBeNull();
  });

  it("键盘：回车定起始日，方向键走，预览跟着键盘，回车定结束日", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<OctoberRange onValueChange={onValueChange} />);
    day("2026-10-09").focus();
    await user.keyboard("{Enter}");
    expect(day("2026-10-09")).toHaveAttribute("data-range-start");

    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(day("2026-10-17")).toHaveFocus();
    expect(day("2026-10-12")).toHaveAttribute("data-preview");
    expect(day("2026-10-17")).toHaveAttribute("data-preview");

    await user.keyboard(" ");
    expect(onValueChange).toHaveBeenLastCalledWith([
      "2026-10-09",
      "2026-10-17",
    ]);
    expect(document.querySelector("[data-preview]")).toBeNull();
  });

  it("起始日定了之后按 Esc：取消这一次，回到原来的那一段", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <OctoberRange
        defaultValue={["2026-10-13", "2026-10-16"]}
        onValueChange={onValueChange}
      />,
    );
    await user.click(day("2026-10-20"));
    expect(selected()).toEqual(["2026-10-20"]);
    await user.keyboard("{Escape}");
    expect(selected()).toHaveLength(4);
    expect(day("2026-10-13")).toHaveAttribute("data-range-start");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("起始日定了之后有一句给读屏的提示，选完就没了", async () => {
    const user = userEvent.setup();
    render(<OctoberRange />);
    const status = () => document.querySelector(".sr-only[aria-live]")!;
    expect(status()).toBeEmptyDOMElement();
    await user.click(day("2026-10-13"));
    expect(status()).toHaveTextContent(
      "2026年10月13日星期二，起始日。再选结束日",
    );
    await user.click(day("2026-10-16"));
    expect(status()).toBeEmptyDOMElement();
  });

  it("两端必须是可选的日子；不可选的日子可以被夹在中间", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    // 周末不可选
    render(
      <OctoberRange
        onValueChange={onValueChange}
        isDateDisabled={(date) => ["2026-10-10", "2026-10-11"].includes(date)}
      />,
    );
    await user.click(day("2026-10-10"));
    expect(document.querySelector("[data-range-start]")).toBeNull();

    await user.click(day("2026-10-09"));
    // 结束日点在不可选的那天上：不算
    await user.click(day("2026-10-11"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(day("2026-10-09")).toHaveAttribute("data-range-start");

    await user.click(day("2026-10-12"));
    expect(onValueChange).toHaveBeenLastCalledWith([
      "2026-10-09",
      "2026-10-12",
    ]);
    // 夹在中间的周末仍然是不可选的样子，但在这一段里
    expect(day("2026-10-10")).toHaveAttribute("data-in-range");
    expect(day("2026-10-10")).toHaveClass("line-through", "bg-ink/10");
    expect(cell("2026-10-10")).toHaveAttribute("aria-selected", "true");
  });

  it("跨月：定了起始日，翻到下个月再定结束日", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<OctoberRange onValueChange={onValueChange} />);
    await user.click(day("2026-10-28"));
    await user.click(screen.getByRole("button", { name: "下个月" }));
    expect(title()).toHaveTextContent("2026年11月");
    await user.click(day("2026-11-05"));
    expect(onValueChange).toHaveBeenLastCalledWith([
      "2026-10-28",
      "2026-11-05",
    ]);
    // 选完之后停在刚点的那个月，不跳回起始日的月份
    expect(title()).toHaveTextContent("2026年11月");
  });

  it("停靠点：有值时是起始日", () => {
    render(<OctoberRange defaultValue={["2026-10-13", "2026-10-16"]} />);
    expect(tabStops()).toEqual([day("2026-10-13")]);
  });

  it("受控：值由外面决定；外面换了值，月历跟过去", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<DateRange | null>([
        "2026-10-13",
        "2026-10-16",
      ]);
      return (
        <>
          <OctoberRange value={value} onValueChange={setValue} />
          <button onClick={() => setValue(["2026-12-01", "2026-12-03"])}>
            十二月
          </button>
          <button onClick={() => setValue(null)}>清除</button>
          <output>{value?.join(" → ") ?? "空"}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(day("2026-10-20"));
    await user.click(day("2026-10-22"));
    expect(screen.getByText("2026-10-20 → 2026-10-22")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "十二月" }));
    expect(title()).toHaveTextContent("2026年12月");
    expect(day("2026-12-02")).toHaveAttribute("data-in-range");

    await user.click(screen.getByRole("button", { name: "清除" }));
    expect(selected()).toEqual([]);
  });

  it("受控：外面每次渲染都给一个新数组，翻过去的月份不会被拽回来", async () => {
    const user = userEvent.setup();
    function Inline() {
      const [, rerender] = useState(0);
      return (
        <>
          <OctoberRange value={["2026-10-13", "2026-10-16"]} />
          <button onClick={() => rerender((count) => count + 1)}>重渲染</button>
        </>
      );
    }
    render(<Inline />);
    await user.click(screen.getByRole("button", { name: "下个月" }));
    await user.click(screen.getByRole("button", { name: "重渲染" }));
    expect(title()).toHaveTextContent("2026年11月");
  });

  it("今天压在两端的块上时，短线换成反转的强调色", () => {
    render(<OctoberRange defaultValue={["2026-10-09", "2026-10-12"]} />);
    expect(day("2026-10-09")).toHaveClass("after:bg-accent-ink-inverse");
  });
});
