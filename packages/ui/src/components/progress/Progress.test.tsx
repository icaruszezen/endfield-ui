import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("输出 progressbar 语义与当前值", () => {
    render(<Progress value={40} aria-label="同步进度" />);
    const bar = screen.getByRole("progressbar", { name: "同步进度" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
  });

  it("填充的宽度按比例", () => {
    render(<Progress value={3} max={12} aria-label="进度" />);
    expect(screen.getByRole("progressbar").firstElementChild).toHaveStyle({
      width: "25%",
    });
  });

  it("值被夹在 0 与 max 之间", () => {
    const { rerender } = render(<Progress value={150} aria-label="进度" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );

    rerender(<Progress value={-5} aria-label="进度" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    // 0 时不画填充，否则描边会留下一条竖线
    expect(screen.getByRole("progressbar")).toBeEmptyDOMElement();
  });

  it("不传 value 是不确定进度：没有 aria-valuenow", () => {
    render(<Progress aria-label="加载中" showValue />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar.firstElementChild).toHaveClass("animate-indeterminate");
    // 没有可显示的数值
    expect(bar.parentElement?.textContent).toBe("");
  });

  it("showValue 显示取整的百分比", () => {
    render(<Progress value={1} max={3} showValue aria-label="进度" />);
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("formatValue 自定义数值的写法", () => {
    render(
      <Progress
        value={96}
        max={128}
        showValue
        formatValue={(value, max) => `${value} / ${max}`}
        aria-label="进度"
      />,
    );
    expect(screen.getByText("96 / 128")).toBeInTheDocument();
  });

  it("分段进度：段数即最大值，已完成的段带标记", () => {
    render(<Progress segments={6} value={3} showValue aria-label="步骤" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemax", "6");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuetext", "3 / 6");

    const segments = bar.firstElementChild!.children;
    expect(segments).toHaveLength(6);
    expect(bar.querySelectorAll("[data-done]")).toHaveLength(3);
    expect(screen.getByText("3 / 6")).toBeInTheDocument();
  });

  it("className 给外层，不给轨道", () => {
    const { container } = render(
      <Progress value={40} className="w-40" aria-label="进度" />,
    );
    expect(container.firstElementChild).toHaveClass("w-40");
    expect(screen.getByRole("progressbar")).not.toHaveClass("w-40");
  });
});
