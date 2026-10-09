import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DateRange } from "../calendar/Calendar";
import { Field } from "../field/Field";
import { DateRangePicker, type DateRangePickerProps } from "./DateRangePicker";

/** 固定"今天"：2026-10-09 */
function Picker(props: DateRangePickerProps) {
  return (
    <DateRangePicker aria-label="发车日期" today="2026-10-09" {...props} />
  );
}

const trigger = () => screen.getByRole("button", { name: /发车日期/ });
const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)!;
const closed = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

describe("DateRangePicker", () => {
  it("是一个有名称的按钮，没选时显示提示", () => {
    render(<Picker />);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveTextContent("选择起止日期");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("有值时写成 2026.10.03 – 2026.10.12；读屏听到的是「至」", () => {
    render(<Picker defaultValue={["2026-10-03", "2026-10-12"]} />);
    expect(trigger()).toHaveTextContent("2026.10.03–至2026.10.12");
    expect(screen.getByText("–")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("至")).toHaveClass("sr-only");
  });

  it("起止是同一天时只写一个日期", () => {
    render(<Picker defaultValue={["2026-10-09", "2026-10-09"]} />);
    expect(trigger()).toHaveTextContent(/^2026\.10\.09$/);
  });

  it("format 换每个日期的写法", () => {
    render(
      <Picker
        defaultValue={["2026-10-03", "2026-10-12"]}
        format={(date) => date.slice(5).replace("-", "/")}
      />,
    );
    expect(trigger()).toHaveTextContent("10/03–至10/12");
  });

  it("点开是一块有名称的面板，里面是能选一段的月历；焦点落在起始日", async () => {
    const user = userEvent.setup();
    render(<Picker defaultValue={["2026-10-13", "2026-10-16"]} />);
    await user.click(trigger());
    const panel = await screen.findByRole("dialog", { name: "选择起止日期" });
    expect(
      within(panel).getByRole("grid", { name: "2026年10月" }),
    ).toHaveAttribute("aria-multiselectable", "true");
    await waitFor(() => expect(day("2026-10-13")).toHaveFocus());
    expect(day("2026-10-14")).toHaveAttribute("data-in-range");
  });

  it("点第一下面板不关，也不通知；第二下选完才通知、关上，焦点回到触发按钮", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Picker onValueChange={onValueChange} />);
    await user.click(trigger());
    await screen.findByRole("dialog");

    await user.click(day("2026-10-13"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(day("2026-10-16"));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith([
      "2026-10-13",
      "2026-10-16",
    ]);
    await closed();
    expect(trigger()).toHaveTextContent("2026.10.13–至2026.10.16");
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it("键盘：打开，回车定起始日，方向键走，回车定结束日", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Picker onValueChange={onValueChange} />);
    trigger().focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog");
    await waitFor(() => expect(day("2026-10-09")).toHaveFocus());
    await user.keyboard("{Enter}{ArrowDown}{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith([
      "2026-10-09",
      "2026-10-17",
    ]);
    await closed();
  });

  it("只定了起始日就按 Esc：面板关上，值不变", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Picker
        defaultValue={["2026-10-13", "2026-10-16"]}
        onValueChange={onValueChange}
      />,
    );
    await user.click(trigger());
    await screen.findByRole("dialog");
    await user.click(day("2026-10-20"));
    await user.keyboard("{Escape}");
    await closed();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("2026.10.13–至2026.10.16");
  });

  it("面板底下是一句提示和清除；没有「今天」", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Picker
        defaultValue={["2026-10-13", "2026-10-16"]}
        onValueChange={onValueChange}
      />,
    );
    await user.click(trigger());
    const panel = await screen.findByRole("dialog");
    expect(
      within(panel).getByText("先选起始日，再选结束日"),
    ).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "今天" })).toBeNull();

    await user.click(within(panel).getByRole("button", { name: "清除" }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    await closed();
    expect(trigger()).toHaveTextContent("选择起止日期");
  });

  it("没有值时清除是禁用的；必填的字段没有清除", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Picker />);
    await user.click(trigger());
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("button", { name: "清除" })).toBeDisabled();

    rerender(<Picker required />);
    expect(within(panel).queryByRole("button", { name: "清除" })).toBeNull();
    expect(trigger()).toHaveAttribute("aria-required", "true");
  });

  it("受控：值由外面决定", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<DateRange | null>(null);
      return (
        <>
          <Picker value={value} onValueChange={setValue} />
          <button onClick={() => setValue(["2026-11-01", "2026-11-03"])}>
            十一月头三天
          </button>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "十一月头三天" }));
    expect(trigger()).toHaveTextContent("2026.11.01–至2026.11.03");
    await user.click(trigger());
    await screen.findByRole("dialog");
    expect(
      screen.getByRole("grid", { name: "2026年11月" }),
    ).toBeInTheDocument();
  });

  it("startName / endName：起止两天各一个表单字段；没选时是空串", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Picker startName="from" endName="to" />
      </form>,
    );
    const form = screen.getByTestId<HTMLFormElement>("form");
    const data = () => Object.fromEntries(new FormData(form));
    expect(data()).toEqual({ from: "", to: "" });

    await user.click(trigger());
    await screen.findByRole("dialog");
    await user.click(day("2026-10-16"));
    await user.click(day("2026-10-13"));
    await closed();
    expect(data()).toEqual({ from: "2026-10-13", to: "2026-10-16" });
  });

  it("min / max 交给月历：范围外的日子定不了端点", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Picker
        min="2026-10-05"
        max="2026-10-25"
        onValueChange={onValueChange}
      />,
    );
    await user.click(trigger());
    await screen.findByRole("dialog");
    await user.click(day("2026-10-02"));
    expect(document.querySelector("[data-range-start]")).toBeNull();
    await user.click(day("2026-10-06"));
    await user.click(day("2026-10-28"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("放进 Field：标签、帮助文字和错误态都关联上", () => {
    render(
      <Field label="发车日期" help="两头都算。" error="请选起止日期。">
        <DateRangePicker today="2026-10-09" />
      </Field>,
    );
    const button = screen.getByRole("button", { name: /发车日期/ });
    expect(button).toHaveAttribute("aria-invalid", "true");
    expect(button).toHaveAccessibleDescription(/请选起止日期/);
    expect(button).toHaveAccessibleDescription(/两头都算/);
  });

  it("禁用时打不开，隐藏字段也不提交", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Picker
          disabled
          startName="from"
          endName="to"
          defaultValue={["2026-10-13", "2026-10-16"]}
        />
      </form>,
    );
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect([
      ...new FormData(screen.getByTestId<HTMLFormElement>("form")),
    ]).toEqual([]);
  });

  it("两种外框、三档尺寸写在外框上", () => {
    const { rerender } = render(<Picker />);
    const box = () => trigger().parentElement!;
    expect(box()).toHaveAttribute("data-variant", "sunken");
    expect(box()).toHaveClass("h-10");
    rerender(<Picker variant="outline" size="sm" />);
    expect(box()).toHaveAttribute("data-variant", "outline");
    expect(box()).toHaveClass("h-8");
  });
});
