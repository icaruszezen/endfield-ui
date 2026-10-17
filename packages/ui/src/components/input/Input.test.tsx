import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("可以输入，属性落在 input 上", async () => {
    const onChange = vi.fn();
    render(
      <Input
        aria-label="代号"
        placeholder="例如 SEVENTH"
        name="codename"
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("textbox", { name: "代号" });
    expect(input).toHaveAttribute("name", "codename");
    expect(input).toHaveAttribute("placeholder", "例如 SEVENTH");

    await userEvent.type(input, "abc");
    expect(input).toHaveValue("abc");
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("className 给外框，ref 给 input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="代号" className="w-40" ref={ref} />);
    const input = screen.getByRole("textbox");
    expect(ref.current).toBe(input);
    expect(input).not.toHaveClass("w-40");
    expect(input.parentElement).toHaveClass("w-40");
  });

  it("invalid 输出 aria-invalid 并多一个图标，不只靠颜色", () => {
    const { container, rerender } = render(<Input aria-label="代号" />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    expect(container.querySelector("svg")).toBeNull();

    rerender(<Input aria-label="代号" invalid />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("渲染前后缀", () => {
    render(<Input aria-label="数量" start={<span>#</span>} end="件" />);
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("件")).toBeInTheDocument();
  });

  it("禁用与只读", async () => {
    const { rerender } = render(<Input aria-label="代号" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();

    rerender(<Input aria-label="代号" readOnly defaultValue="SEVENTH" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readonly");
    await userEvent.type(input, "x");
    expect(input).toHaveValue("SEVENTH");
  });

  it("高对比模式：禁用时框里的字写明灰字色", () => {
    // 没写 type 的 <input> 禁用了，系统不替它换成灰字色。写成 disabled: 的变体：
    // 没禁用时它不生效，所以两种状态是同一个类
    render(<Input aria-label="代号" disabled defaultValue="SEVENTH" />);
    expect(screen.getByRole("textbox")).toHaveClass(
      "forced-colors:disabled:text-[GrayText]",
    );
  });

  it("高对比模式：只读时占位的透明边线写成页面色，不让系统显形", () => {
    const box = () => screen.getByRole("textbox").parentElement;
    const { rerender } = render(<Input aria-label="代号" readOnly />);
    expect(box()).toHaveClass(
      "border-transparent",
      "forced-colors:border-[Canvas]",
    );

    rerender(<Input aria-label="代号" readOnly variant="outline" />);
    expect(box()).toHaveClass("forced-colors:border-[Canvas]");

    // 能填的那条线要留着；只读又报错、只读又禁用时，边线是错误 / 禁用的颜色，也留着
    for (const props of [
      {},
      { readOnly: true, invalid: true },
      { readOnly: true, disabled: true },
    ]) {
      rerender(<Input aria-label="代号" {...props} />);
      expect(box()).not.toHaveClass("forced-colors:border-[Canvas]");
    }
  });

  it("默认是凹陷底 + 底边线，outline 换成四边描边", () => {
    const { rerender } = render(<Input aria-label="代号" />);
    let box = screen.getByRole("textbox").parentElement;
    expect(box).toHaveAttribute("data-variant", "sunken");
    expect(box).toHaveClass("border-b-2", "bg-surface-sunken");

    rerender(<Input aria-label="代号" variant="outline" />);
    box = screen.getByRole("textbox").parentElement;
    expect(box).toHaveAttribute("data-variant", "outline");
    expect(box).toHaveClass("border", "bg-surface");
    expect(box).not.toHaveClass("border-b-2", "bg-surface-sunken");
  });

  it("尺寸写在外框上", () => {
    render(<Input aria-label="代号" size="lg" />);
    expect(screen.getByRole("textbox").parentElement).toHaveAttribute(
      "data-size",
      "lg",
    );
  });

  it("聚焦的墨线从左往右擦出：sunken 是底边线上的一条线，outline 是整圈", () => {
    const { rerender } = render(<Input aria-label="代号" />);
    let box = screen.getByRole("textbox").parentElement!;
    expect(box).toHaveClass(
      "before:origin-left",
      "before:scale-x-0",
      "before:bg-ink",
      "focus-within:before:scale-x-100",
      "focus-within:before:duration-(--duration-base)",
      "before:duration-(--duration-fast)",
    );

    rerender(<Input aria-label="代号" variant="outline" />);
    box = screen.getByRole("textbox").parentElement!;
    expect(box).toHaveClass(
      "before:-inset-px",
      "before:border",
      "before:border-ink",
      "before:[clip-path:inset(0_100%_0_0)]",
      "focus-within:before:[clip-path:inset(0)]",
    );
  });

  it("报错、禁用、只读时不画那条聚焦的线", () => {
    const { rerender } = render(<Input aria-label="代号" invalid />);
    const line = () => screen.getByRole("textbox").parentElement!;
    expect(line()).not.toHaveClass("before:scale-x-0");

    for (const props of [{ disabled: true }, { readOnly: true }]) {
      rerender(<Input aria-label="代号" {...props} />);
      expect(line()).not.toHaveClass("before:scale-x-0");
    }

    rerender(<Input aria-label="代号" />);
    expect(line()).toHaveClass("before:scale-x-0");
  });
});
