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

  it("尺寸写在外框上", () => {
    render(<Input aria-label="代号" size="lg" />);
    expect(screen.getByRole("textbox").parentElement).toHaveAttribute(
      "data-size",
      "lg",
    );
  });
});
