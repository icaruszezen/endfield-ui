import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline, TimelineItem } from "./Timeline";

function renderTimeline() {
  render(
    <Timeline aria-label="勘探日程">
      <TimelineItem date="10.02" title="路线勘定">
        已归档
      </TimelineItem>
      <TimelineItem status="current" date="10.08" title="补给站扩建" />
      <TimelineItem status="upcoming" date="10.21" title="终端停机维护" />
    </Timeline>,
  );
}

describe("Timeline", () => {
  it("渲染成有序列表", () => {
    renderTimeline();
    expect(screen.getByRole("list", { name: "勘探日程" }).tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("三种状态写在条目上，默认是已过", () => {
    renderTimeline();
    const [past, current, upcoming] = screen.getAllByRole("listitem");
    expect(past).toHaveAttribute("data-status", "past");
    expect(current).toHaveAttribute("data-status", "current");
    expect(upcoming).toHaveAttribute("data-status", "upcoming");
  });

  it("只有当前项带 aria-current", () => {
    renderTimeline();
    const [past, current, upcoming] = screen.getAllByRole("listitem");
    expect(current).toHaveAttribute("aria-current", "step");
    expect(past).not.toHaveAttribute("aria-current");
    expect(upcoming).not.toHaveAttribute("aria-current");
  });

  it("当前项的标题加粗，日期、标题、说明都在", () => {
    renderTimeline();
    expect(screen.getByText("补给站扩建")).toHaveClass("font-bold");
    expect(screen.getByText("路线勘定")).not.toHaveClass("font-bold");
    expect(screen.getByText("10.02")).toBeInTheDocument();
    expect(screen.getByText("已归档")).toBeInTheDocument();
  });

  it("节点与轴线是装饰，对读屏隐藏", () => {
    renderTimeline();
    const first = screen.getAllByRole("listitem")[0]!;
    expect(first.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
