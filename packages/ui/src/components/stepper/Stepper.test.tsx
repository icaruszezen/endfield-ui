import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { Stepper } from "./Stepper";

const spin = () => screen.getByRole("spinbutton");
const minus = () => screen.getByRole("button", { name: "减少" });
const plus = () => screen.getByRole("button", { name: "增加" });

describe("Stepper", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("输出 spinbutton 语义与当前值、上下限", () => {
    render(
      <Stepper aria-label="数量" defaultValue={3} min={1} max={9} name="qty" />,
    );
    const input = screen.getByRole("spinbutton", { name: "数量" });
    expect(input).toHaveValue("3");
    expect(input).toHaveAttribute("aria-valuenow", "3");
    expect(input).toHaveAttribute("aria-valuemin", "1");
    expect(input).toHaveAttribute("aria-valuemax", "9");
    expect(input).toHaveAttribute("name", "qty");
  });

  it("没给初始值时从 min 开始，没有 min 则从 0 开始", () => {
    const { unmount } = render(<Stepper aria-label="数量" min={5} />);
    expect(spin()).toHaveValue("5");
    unmount();

    render(<Stepper aria-label="数量" />);
    expect(spin()).toHaveValue("0");
  });

  it("点两端的按钮加减一步，每次点击只走一步", async () => {
    const onValueChange = vi.fn();
    render(
      <Stepper
        aria-label="数量"
        defaultValue={3}
        onValueChange={onValueChange}
      />,
    );

    await userEvent.click(plus());
    expect(spin()).toHaveValue("4");
    expect(onValueChange).toHaveBeenLastCalledWith(4);

    await userEvent.click(minus());
    await userEvent.click(minus());
    expect(spin()).toHaveValue("2");
    expect(onValueChange).toHaveBeenCalledTimes(3);
  });

  it("到达上下限时对应的按钮禁用", async () => {
    render(<Stepper aria-label="数量" defaultValue={1} min={1} max={2} />);
    expect(minus()).toBeDisabled();
    expect(plus()).toBeEnabled();

    await userEvent.click(plus());
    expect(spin()).toHaveValue("2");
    expect(plus()).toBeDisabled();
    expect(minus()).toBeEnabled();
  });

  it("两端的按钮不占 Tab 顺序", () => {
    render(<Stepper aria-label="数量" />);
    expect(minus()).toHaveAttribute("tabindex", "-1");
    expect(plus()).toHaveAttribute("tabindex", "-1");
  });

  it("键盘：方向键一步、翻页键十步、Home / End 到上下限", () => {
    render(<Stepper aria-label="数量" defaultValue={50} min={0} max={100} />);
    const input = spin();

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("51");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("49");
    fireEvent.keyDown(input, { key: "PageUp" });
    expect(input).toHaveValue("59");
    fireEvent.keyDown(input, { key: "PageDown" });
    expect(input).toHaveValue("49");
    fireEvent.keyDown(input, { key: "End" });
    expect(input).toHaveValue("100");
    fireEvent.keyDown(input, { key: "Home" });
    expect(input).toHaveValue("0");
  });

  it("加减不会越过上下限", () => {
    render(<Stepper aria-label="数量" defaultValue={95} min={0} max={100} />);
    fireEvent.keyDown(spin(), { key: "PageUp" });
    expect(spin()).toHaveValue("100");
  });

  it("直接输入：输入中不打断，失焦时才落定并夹到范围内", async () => {
    const onValueChange = vi.fn();
    render(
      <Stepper
        aria-label="数量"
        defaultValue={3}
        min={1}
        max={99}
        onValueChange={onValueChange}
      />,
    );
    const input = spin();

    await userEvent.clear(input);
    await userEvent.type(input, "500");
    // 输入中：框里是敲的字，值还没变
    expect(input).toHaveValue("500");
    expect(onValueChange).not.toHaveBeenCalled();

    await userEvent.tab();
    expect(input).toHaveValue("99");
    expect(onValueChange).toHaveBeenLastCalledWith(99);
  });

  it("回车也会落定；清空后失焦还原成原来的值", async () => {
    render(<Stepper aria-label="数量" defaultValue={3} />);
    const input = spin();

    await userEvent.clear(input);
    await userEvent.type(input, "12{Enter}");
    expect(input).toHaveValue("12");
    expect(input).toHaveAttribute("aria-valuenow", "12");

    await userEvent.clear(input);
    await userEvent.tab();
    expect(input).toHaveValue("12");
  });

  it("字母进不了输入框", async () => {
    render(<Stepper aria-label="数量" defaultValue={3} />);
    await userEvent.type(spin(), "a");
    expect(spin()).toHaveValue("3");
  });

  it("小数步长不带出浮点尾数", () => {
    render(<Stepper aria-label="浓度" defaultValue={0.1} step={0.1} />);
    fireEvent.keyDown(spin(), { key: "ArrowUp" });
    fireEvent.keyDown(spin(), { key: "ArrowUp" });
    expect(spin()).toHaveValue("0.3");
    expect(spin()).toHaveAttribute("inputmode", "decimal");
  });

  it("按住按钮连续加减，松开就停", () => {
    vi.useFakeTimers();
    render(<Stepper aria-label="数量" defaultValue={0} />);

    fireEvent.pointerDown(plus());
    expect(spin()).toHaveValue("1");

    // 按住 400ms 后开始连发，每 80ms 一步
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(spin()).toHaveValue("1");
    for (let tick = 0; tick < 3; tick++) {
      act(() => {
        vi.advanceTimersByTime(80);
      });
    }
    expect(spin()).toHaveValue("4");

    fireEvent.pointerUp(plus());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(spin()).toHaveValue("4");
  });

  it("按住到头后停表，不再触发 onValueChange", () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    render(
      <Stepper
        aria-label="数量"
        defaultValue={8}
        max={10}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.pointerDown(plus());
    for (let tick = 0; tick < 20; tick++) {
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }
    expect(spin()).toHaveValue("10");
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("键盘和读屏触发的 click 也算一步", () => {
    render(<Stepper aria-label="数量" defaultValue={3} />);
    // 没有经过指针按下的 click，次数是 0
    fireEvent.click(plus());
    expect(spin()).toHaveValue("4");
  });

  it("受控：值由外面决定", async () => {
    function Controlled() {
      const [value, setValue] = useState(2);
      return (
        <Stepper
          aria-label="数量"
          value={value}
          onValueChange={(next) => setValue(next * 2)}
        />
      );
    }
    render(<Controlled />);
    await userEvent.click(plus());
    // 组件报的是 3，外面存成了 6
    expect(spin()).toHaveValue("6");
  });

  it("禁用与只读时不能加减", () => {
    const { rerender } = render(
      <Stepper aria-label="数量" defaultValue={3} disabled />,
    );
    expect(spin()).toBeDisabled();
    expect(minus()).toBeDisabled();
    expect(plus()).toBeDisabled();

    rerender(<Stepper aria-label="数量" defaultValue={3} readOnly />);
    expect(plus()).toBeDisabled();
    fireEvent.keyDown(spin(), { key: "ArrowUp" });
    expect(spin()).toHaveValue("3");
  });

  it("放进 Field：标签、错误说明与错误态都关联上", () => {
    render(
      <Field label="数量" error="数量不能超过库存 64 件。">
        <Stepper defaultValue={128} />
      </Field>,
    );
    const input = screen.getByRole("spinbutton", { name: "数量" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("数量不能超过库存 64 件。");
  });

  it("className 给外框，尺寸写在外框上", () => {
    render(<Stepper aria-label="数量" size="lg" className="w-40" />);
    const box = spin().parentElement;
    expect(box).toHaveClass("w-40");
    expect(box).toHaveAttribute("data-size", "lg");
    expect(spin()).not.toHaveClass("w-40");
  });
});
