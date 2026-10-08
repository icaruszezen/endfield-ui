import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResourceChip } from "./ResourceChip";

describe("ResourceChip", () => {
  it("数量用等宽数字", () => {
    render(<ResourceChip data-testid="chip">1,280</ResourceChip>);
    expect(screen.getByTestId("chip")).toHaveClass("font-tech", "tabular-nums");
    expect(screen.getByText("1,280")).toBeInTheDocument();
  });

  it("图标是装饰，对读屏隐藏", () => {
    render(<ResourceChip icon={<svg data-testid="icon" />}>64</ResourceChip>);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("提供 label 时数字对读屏隐藏，改读完整说明", () => {
    render(<ResourceChip label="燃料 1,280">1,280</ResourceChip>);
    expect(screen.getByText("1,280")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("燃料 1,280")).toBeInTheDocument();
  });
});
