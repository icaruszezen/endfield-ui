import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { DatePicker } from "./DatePicker";

/** 固定"今天"：2026-10-09 */
function Picker(props: Partial<React.ComponentProps<typeof DatePicker>>) {
  return <DatePicker aria-label="发车日期" today="2026-10-09" {...props} />;
}

const trigger = () => screen.getByRole("button", { name: /发车日期/ });
const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)!;
const closed = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

describe("DatePicker", () => {
  it("是一个有名称的按钮，没选时显示提示", () => {
    render(<Picker placeholder="哪天发车" />);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveTextContent("哪天发车");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("有值时写成 2026.10.09；format 可以换", () => {
    const { rerender } = render(<Picker defaultValue="2026-10-09" />);
    expect(trigger()).toHaveTextContent("2026.10.09");
    rerender(
      <Picker
        key="custom"
        defaultValue="2026-10-09"
        format={(date) =>
          `${Number(date.slice(5, 7))} 月 ${Number(date.slice(8))} 日`
        }
      />,
    );
    expect(trigger()).toHaveTextContent("10 月 9 日");
  });

  it("点开是一块有名称的面板，里面是月历；焦点落在选中的那一天", async () => {
    const user = userEvent.setup();
    render(<Picker defaultValue="2026-10-20" />);
    await user.click(trigger());
    const panel = await screen.findByRole("dialog", { name: "选择日期" });
    expect(
      within(panel).getByRole("grid", { name: "2026年10月" }),
    ).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(day("2026-10-20")).toHaveFocus());
  });

  it("没选时焦点落在今天", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.click(trigger());
    await screen.findByRole("dialog");
    await waitFor(() => expect(day("2026-10-09")).toHaveFocus());
  });

  it("选一天：通知 onValueChange，面板关上，焦点回到触发按钮", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Picker onValueChange={onValueChange} />);
    await user.click(trigger());
    await screen.findByRole("dialog");
    await user.click(day("2026-10-15"));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-15");
    await closed();
    expect(trigger()).toHaveTextContent("2026.10.15");
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it("键盘：打开，方向键走到别的日子，回车选中", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Picker onValueChange={onValueChange} />);
    trigger().focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog");
    await waitFor(() => expect(day("2026-10-09")).toHaveFocus());
    await user.keyboard("{ArrowDown}{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-17");
    await closed();
  });

  it("Esc 关闭，不改值", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Picker defaultValue="2026-10-09" onValueChange={onValueChange} />);
    await user.click(trigger());
    await screen.findByRole("dialog");
    await user.keyboard("{ArrowRight}{Escape}");
    await closed();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("2026.10.09");
  });

  it("面板里的今天和清除", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Picker defaultValue="2026-10-20" onValueChange={onValueChange} />);
    await user.click(trigger());
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("button", { name: "今天" }));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-09");
    await closed();

    await user.click(trigger());
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "清除",
      }),
    );
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    await closed();
    expect(trigger()).toHaveTextContent("选择日期");
  });

  it("没有值时清除是禁用的；必填的字段没有清除", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Picker />);
    await user.click(trigger());
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("button", { name: "清除" })).toBeDisabled();

    rerender(<Picker required />);
    expect(
      within(screen.getByRole("dialog")).queryByRole("button", {
        name: "清除",
      }),
    ).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-required", "true");
  });

  it("今天不在可选范围里时，今天那个钮禁用", async () => {
    const user = userEvent.setup();
    render(<Picker min="2026-10-12" />);
    await user.click(trigger());
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("button", { name: "今天" })).toBeDisabled();
    // 焦点被夹到范围里的第一天
    await waitFor(() => expect(day("2026-10-12")).toHaveFocus());
  });

  it("受控：值由外面决定", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>("2026-10-09");
      return (
        <>
          <Picker value={value} onValueChange={setValue} />
          <output>{value ?? "空"}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(trigger());
    await screen.findByRole("dialog");
    await user.click(day("2026-10-30"));
    expect(screen.getByRole("status")).toHaveTextContent("2026-10-30");
    expect(trigger()).toHaveTextContent("2026.10.30");
  });

  it("带 name 时值随表单提交；没选时是空串", () => {
    render(
      <form data-testid="form">
        <Picker name="depart" defaultValue="2026-10-09" />
        <DatePicker aria-label="到站日期" name="arrive" />
      </form>,
    );
    const data = new FormData(screen.getByTestId<HTMLFormElement>("form"));
    expect(data.get("depart")).toBe("2026-10-09");
    expect(data.get("arrive")).toBe("");
  });

  it("放进 Field：标签、帮助文字和错误态都关联上", () => {
    render(
      <Field label="发车日期" help="只能选今天之后" error="这一天已经排满了">
        <DatePicker today="2026-10-09" defaultValue="2026-10-09" />
      </Field>,
    );
    const button = screen.getByRole("button", { name: /发车日期/ });
    expect(button).toHaveAttribute("aria-invalid", "true");
    expect(button).toHaveAccessibleDescription(
      "这一天已经排满了 只能选今天之后",
    );
  });

  it("禁用时打不开", async () => {
    const user = userEvent.setup();
    render(<Picker disabled />);
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("两种外框、三档尺寸写在外框上", () => {
    const { rerender } = render(<Picker />);
    const box = () => trigger().parentElement!;
    expect(box()).toHaveAttribute("data-variant", "sunken");
    expect(box()).toHaveClass("h-10");
    rerender(<Picker variant="outline" size="lg" />);
    expect(box()).toHaveAttribute("data-variant", "outline");
    expect(box()).toHaveClass("h-14");
  });
});
