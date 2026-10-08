import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stat } from "./Stat";

describe("Stat", () => {
  it("按 微标 → 数字 → 单位 的顺序渲染，// 对读屏隐藏", () => {
    const { container } = render(
      <Stat label="TOTAL" value="1,280" unit="件" />,
    );
    expect(container).toHaveTextContent("// TOTAL1,280件");
    expect(screen.getByText("//")).toHaveAttribute("aria-hidden", "true");
  });

  it("数字用等宽数字", () => {
    render(<Stat label="TOTAL" value="1,280" />);
    expect(screen.getByText("1,280")).toHaveClass("font-tech", "tabular-nums");
  });

  it("增量默认渲染为增益签", () => {
    render(<Stat label="TOTAL" value="1,280" delta="+6%" />);
    expect(screen.getByText("+6%")).toHaveAttribute("data-variant", "gain");
  });

  it("下降渲染为危险色文字，不是增益签", () => {
    render(<Stat label="TOTAL" value="1,280" delta="−2%" trend="down" />);
    const delta = screen.getByText("−2%");
    expect(delta).toHaveClass("text-danger");
    expect(delta).not.toHaveAttribute("data-variant");
  });

  it("lg 用更大的字阶", () => {
    render(<Stat label="TOTAL" value="96" size="lg" />);
    expect(screen.getByText("96")).toHaveClass("text-5xl");
  });
});
