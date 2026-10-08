import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecIndicator } from "./RecIndicator";

describe("RecIndicator", () => {
  it("默认写 REC，文字可读", () => {
    render(<RecIndicator />);
    const label = screen.getByText("REC");
    expect(label).not.toHaveAttribute("aria-hidden");
  });

  it("红点与方括号对读屏隐藏", () => {
    render(<RecIndicator data-testid="rec" />);
    const hidden = screen
      .getByTestId("rec")
      .querySelectorAll('[aria-hidden="true"]');
    expect(hidden).toHaveLength(3);
  });

  it("红点默认明灭，可以关掉", () => {
    const { rerender } = render(<RecIndicator data-testid="rec" />);
    expect(screen.getByTestId("rec").firstElementChild).toHaveClass(
      "animate-blink",
    );

    rerender(<RecIndicator data-testid="rec" blink={false} />);
    expect(screen.getByTestId("rec").firstElementChild).not.toHaveClass(
      "animate-blink",
    );
  });

  it("文字可以换成别的进行中状态", () => {
    render(<RecIndicator label="LIVE" />);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });
});
