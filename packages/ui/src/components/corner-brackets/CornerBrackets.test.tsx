import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CornerBrackets } from "./CornerBrackets";

describe("CornerBrackets", () => {
  it("默认画括号，内容照常渲染", () => {
    render(<CornerBrackets data-testid="box">内容</CornerBrackets>);
    const box = screen.getByTestId("box");
    expect(box).toHaveTextContent("内容");
    expect(box).toHaveClass("corner-brackets", "after:animate-bracket-in");
    expect(box).toHaveAttribute("data-visible");
  });

  it("visible 关掉后不画，盒子还在", () => {
    render(
      <CornerBrackets data-testid="box" visible={false}>
        内容
      </CornerBrackets>,
    );
    const box = screen.getByTestId("box");
    expect(box).not.toHaveClass("corner-brackets");
    expect(box).not.toHaveClass("after:animate-bracket-in");
    expect(box).not.toHaveAttribute("data-visible");
    expect(box).toHaveTextContent("内容");
  });

  it("两档臂长", () => {
    const { rerender } = render(<CornerBrackets data-testid="box" />);
    expect(screen.getByTestId("box")).toHaveClass("[--bracket-arm:12px]");

    rerender(<CornerBrackets data-testid="box" size="md" />);
    expect(screen.getByTestId("box")).toHaveClass("[--bracket-arm:16px]");
  });
});
