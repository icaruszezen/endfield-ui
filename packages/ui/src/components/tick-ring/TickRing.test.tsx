import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TickRing } from "./TickRing";

describe("TickRing", () => {
  it("圆环是装饰，主体照常渲染", () => {
    render(
      <TickRing data-testid="ring">
        <span>主体</span>
      </TickRing>,
    );
    const ring = screen.getByTestId("ring");
    expect(ring.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("主体")).toBeInTheDocument();
  });

  it("直径默认 240，可以传数字或长度", () => {
    const { rerender } = render(<TickRing data-testid="ring" />);
    expect(screen.getByTestId("ring").style.width).toBe("240px");
    expect(screen.getByTestId("ring")).toHaveClass("aspect-square");

    rerender(<TickRing data-testid="ring" size="100%" />);
    expect(screen.getByTestId("ring").style.width).toBe("100%");
  });

  it("刻度根数决定 pathLength", () => {
    const { rerender } = render(<TickRing data-testid="ring" />);
    const ticks = () =>
      screen.getByTestId("ring").querySelector("[data-ticks]");
    expect(ticks()).toHaveAttribute("data-ticks", "40");
    expect(ticks()).toHaveAttribute("pathLength", "400");

    rerender(<TickRing data-testid="ring" ticks={60} />);
    expect(ticks()).toHaveAttribute("pathLength", "600");
  });

  it("spin 打开后慢速旋转", () => {
    const { rerender } = render(<TickRing data-testid="ring" />);
    const svg = () => screen.getByTestId("ring").querySelector("svg");
    expect(svg()).not.toHaveClass("animate-spin-slow");

    rerender(<TickRing data-testid="ring" spin />);
    expect(svg()).toHaveClass("animate-spin-slow");
  });
});
