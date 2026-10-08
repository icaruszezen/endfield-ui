import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hatch } from "./Hatch";

describe("Hatch", () => {
  it("是一块对读屏隐藏的装饰", () => {
    render(<Hatch data-testid="hatch" className="h-10" />);
    const hatch = screen.getByTestId("hatch");
    expect(hatch).toHaveAttribute("aria-hidden", "true");
    expect(hatch).toHaveClass("hatch", "pointer-events-none", "h-10");
  });

  it("三档粗细", () => {
    const { rerender } = render(<Hatch data-testid="hatch" />);
    const hatch = () => screen.getByTestId("hatch");
    expect(hatch()).toHaveAttribute("data-density", "bold");
    expect(hatch()).not.toHaveClass("hatch-mid");
    expect(hatch()).not.toHaveClass("hatch-fine");

    rerender(<Hatch data-testid="hatch" density="mid" />);
    expect(hatch()).toHaveClass("hatch", "hatch-mid");

    rerender(<Hatch data-testid="hatch" density="fine" />);
    expect(hatch()).toHaveClass("hatch", "hatch-fine");
  });
});
