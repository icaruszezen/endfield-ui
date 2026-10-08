import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("显示数量", () => {
    render(<Badge count={12} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("超过上限显示为 max+", () => {
    render(<Badge count={120} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("自定义上限", () => {
    render(<Badge count={12} max={9} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("数量为 0 时默认不显示，showZero 时显示", () => {
    const { container, rerender } = render(<Badge count={0} />);
    expect(container.querySelector("[data-badge]")).toBeNull();

    rerender(<Badge count={0} showZero />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("提供 label 时数字对读屏隐藏，改读完整说明", () => {
    render(<Badge count={12} label="12 条未读" />);
    expect(screen.getByText("12")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("12 条未读")).toBeInTheDocument();
  });

  it("dot 渲染为装饰性的菱形", () => {
    const { container } = render(<Badge dot label="有新消息" />);
    expect(container.querySelector('[data-badge="dot"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByText("有新消息")).toBeInTheDocument();
  });

  it("包住子元素时两者都渲染", () => {
    render(
      <Badge count={3}>
        <button type="button">通知</button>
      </Badge>,
    );
    expect(screen.getByRole("button", { name: "通知" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
