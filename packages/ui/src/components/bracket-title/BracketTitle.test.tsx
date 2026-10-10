import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubInView } from "../../test/in-view";
import { BracketTitle } from "./BracketTitle";

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it("入场：进视口前括号和名称都是透明的；进了之后括号先淡入，名称晚 100ms", () => {
    const enter = stubInView();
    render(<BracketTitle>仓库</BracketTitle>);
    const [open, name, close] = screen.getByRole("heading").children;
    for (const part of [open, name, close]) {
      expect(part).toHaveClass("opacity-0");
      expect(part).not.toHaveClass("animate-fade-in");
    }

    enter();
    for (const part of [open, name, close]) {
      expect(part).toHaveClass("animate-fade-in");
      expect(part).not.toHaveClass("opacity-0");
    }
    expect(name).toHaveClass("[animation-delay:100ms]");
    expect(open).not.toHaveClass("[animation-delay:100ms]");
    // 只淡入：行内的字做不了位移
    expect(screen.getByRole("heading").innerHTML).not.toMatch(
      /shift|translate/,
    );
  });

  it("animate=false 时不藏、不播；名称外面那一层没有多余的类", () => {
    stubInView();
    render(<BracketTitle animate={false}>仓库</BracketTitle>);
    const [open, name, close] = screen.getByRole("heading").children;
    expect(name).toHaveTextContent("仓库");
    expect(name).not.toHaveAttribute("class");
    for (const part of [open, close]) {
      expect(part!.className).not.toMatch(/opacity-0|animate-/);
    }
  });

  it("转发 ref", () => {
    let node: HTMLHeadingElement | null = null;
    render(
      <BracketTitle
        ref={(element) => {
          node = element;
        }}
      >
        仓库
      </BracketTitle>,
    );
    expect(node).toBe(screen.getByRole("heading"));
  });
});
