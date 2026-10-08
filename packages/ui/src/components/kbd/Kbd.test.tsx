import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kbd } from "./Kbd";

describe("Kbd", () => {
  it("渲染成 <kbd>", () => {
    render(<Kbd>F</Kbd>);
    expect(screen.getByText("F").tagName).toBe("KBD");
  });

  it("两档尺寸", () => {
    const { rerender } = render(<Kbd>F</Kbd>);
    expect(screen.getByText("F")).toHaveClass("h-5", "min-w-5");

    rerender(<Kbd size="md">F</Kbd>);
    expect(screen.getByText("F")).toHaveClass("h-6", "min-w-6");
  });

  it("其余属性落在 <kbd> 上", () => {
    render(
      <Kbd className="ml-2" title="确认">
        Enter
      </Kbd>,
    );
    const key = screen.getByText("Enter");
    expect(key).toHaveClass("ml-2");
    expect(key).toHaveAttribute("title", "确认");
  });
});
