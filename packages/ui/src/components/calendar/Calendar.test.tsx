import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "./Calendar";

/** 固定"今天"：2026-10-09，星期五 */
function October(props: Partial<React.ComponentProps<typeof Calendar>>) {
  return <Calendar today="2026-10-09" {...props} />;
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
