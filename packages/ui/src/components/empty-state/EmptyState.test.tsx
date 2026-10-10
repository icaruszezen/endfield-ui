import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("渲染标题、说明与行动", () => {
    render(
      <EmptyState
        title="暂无记录"
        description="完成一次任务后，这里会出现记录。"
        action={<button type="button">新建任务</button>}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "暂无记录" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("完成一次任务后，这里会出现记录。"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "新建任务" }),
    ).toBeInTheDocument();
  });

  it("标题层级可调", () => {
    render(<EmptyState title="暂无记录" level={2} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("默认带一个对读屏隐藏的图形，传 null 去掉", () => {
    const { container, rerender } = render(<EmptyState title="暂无记录" />);
    expect(container.querySelector("svg")?.parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    rerender(<EmptyState title="暂无记录" icon={null} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("bordered 关掉后没有虚线描边", () => {
    const { container, rerender } = render(<EmptyState title="暂无记录" />);
    expect(container.firstElementChild).toHaveClass("border-dashed");

    rerender(<EmptyState title="暂无记录" bordered={false} />);
    expect(container.firstElementChild).not.toHaveClass("border-dashed");
  });

  it("入场：挂上时淡入，不位移；animate=false 关掉", () => {
    const { container, rerender } = render(<EmptyState title="暂无记录" />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass("animate-fade-in");
    expect(root.className).not.toMatch(/shift|translate|opacity-0/);

    rerender(<EmptyState title="暂无记录" animate={false} />);
    expect(root.className).not.toMatch(/animate-/);
    expect(root).not.toHaveAttribute("animate");
  });
});
