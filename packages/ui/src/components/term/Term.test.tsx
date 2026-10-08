import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Term } from "./Term";

describe("Term", () => {
  it("是一个加粗并着色的 <strong>", () => {
    render(<Term>120%</Term>);
    const term = screen.getByText("120%");
    expect(term.tagName).toBe("STRONG");
    expect(term).toHaveClass("font-bold", "text-accent-ink");
    expect(term).toHaveAttribute("data-tone", "accent");
  });

  it("色调用文字档的语义色", () => {
    render(
      <>
        <Term tone="danger">灼烧</Term>
        <Term tone="info">冻结</Term>
      </>,
    );
    expect(screen.getByText("灼烧")).toHaveClass("text-danger");
    expect(screen.getByText("冻结")).toHaveClass("text-info");
  });

  it("图标对读屏隐藏", () => {
    render(
      <Term tone="warning" icon={<svg data-testid="icon" />}>
        过载
      </Term>,
    );
    const term = screen.getByText("过载");
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(term).toHaveTextContent("过载");
  });
});
