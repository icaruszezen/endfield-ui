import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BracketTitle } from "./BracketTitle";

describe("BracketTitle", () => {
  it("默认是三级标题，可访问名称里没有括号", () => {
    render(<BracketTitle>北区仓储站</BracketTitle>);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveAccessibleName("北区仓储站");
    expect(heading).toHaveTextContent("[北区仓储站]");
  });

  it("两个括号对读屏隐藏", () => {
    render(<BracketTitle>仓库</BracketTitle>);
    const brackets = screen
      .getByRole("heading")
      .querySelectorAll('[aria-hidden="true"]');
    expect(brackets).toHaveLength(2);
    expect(brackets[0]).toHaveTextContent("[");
    expect(brackets[1]).toHaveTextContent("]");
    expect(brackets[0]).toHaveClass("text-ink-tertiary", "font-medium");
  });

  it("层级与字号可以改", () => {
    render(
      <BracketTitle level={1} className="text-3xl">
        仓库
      </BracketTitle>,
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-3xl");
    expect(heading).not.toHaveClass("text-4xl");
  });
});
