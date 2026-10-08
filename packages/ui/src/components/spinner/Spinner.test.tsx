import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it('默认是一个状态区，读作"加载中"', () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveTextContent("加载中");
  });

  it("读屏听到的话可以换掉", () => {
    render(<Spinner label="正在同步" />);
    expect(screen.getByRole("status")).toHaveTextContent("正在同步");
  });

  it("旋转的方块本身对读屏隐藏", () => {
    render(<Spinner />);
    const square = screen.getByRole("status").firstElementChild;
    expect(square).toHaveAttribute("aria-hidden", "true");
    expect(square).toHaveClass("animate-spin");
  });

  it("label 传 null 时整个是装饰", () => {
    const { container } = render(<Spinner label={null} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).toHaveClass("animate-spin");
  });

  it("两档尺寸，className 可以覆盖", () => {
    const { container, rerender } = render(<Spinner label={null} size="sm" />);
    expect(container.firstElementChild).toHaveClass("size-3");

    rerender(<Spinner label={null} className="size-2" />);
    expect(container.firstElementChild).toHaveClass("size-2");
    expect(container.firstElementChild).not.toHaveClass("size-4");
  });
});
