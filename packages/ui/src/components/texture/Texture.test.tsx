import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Texture } from "./Texture";

describe("Texture", () => {
  it("是一层对读屏隐藏、不挡点击的装饰，默认铺满定位祖先", () => {
    render(<Texture data-testid="texture" />);
    const texture = screen.getByTestId("texture");
    expect(texture).toHaveAttribute("aria-hidden", "true");
    expect(texture).toHaveClass(
      "pointer-events-none",
      "absolute",
      "inset-0",
      "dot-grid",
    );
  });

  it("三种底纹各用一个工具类", () => {
    const { rerender } = render(<Texture data-testid="texture" />);
    const texture = () => screen.getByTestId("texture");
    expect(texture()).toHaveAttribute("data-variant", "dots");

    rerender(<Texture data-testid="texture" variant="grid" />);
    expect(texture()).toHaveClass("blueprint-grid");
    expect(texture()).not.toHaveClass("dot-grid");

    rerender(<Texture data-testid="texture" variant="contour" />);
    expect(texture()).toHaveClass("contour");
  });

  it("位置可以被 className 改掉", () => {
    render(<Texture data-testid="texture" className="relative h-40" />);
    const texture = screen.getByTestId("texture");
    expect(texture).toHaveClass("relative", "h-40");
    expect(texture).not.toHaveClass("absolute");
  });
});
