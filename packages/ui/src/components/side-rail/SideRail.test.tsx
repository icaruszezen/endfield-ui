import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RouterLink } from "../../test/RouterLink";
import { NavAction } from "../nav-action/NavAction";
import {
  SideRail,
  SideRailGroup,
  SideRailItem,
  type SideRailProps,
} from "./SideRail";

const icon = <svg />;

function Rail(props: Partial<SideRailProps>) {
  return (
    <SideRail
      aria-label="主导航"
      brand={<a href="#home">第七勘探队</a>}
      tools={<button type="button">切换主题</button>}
      action={<NavAction href="#console">前往控制台</NavAction>}
      footer={<span>v0.1</span>}
      {...props}
    >
      <SideRailItem icon={icon} href="#overview">
        总览
      </SideRailItem>
      <SideRailItem icon={icon} href="#dispatch" current end={<span>12</span>}>
        调度
      </SideRailItem>
      <SideRailItem icon={icon} href="#settings" disabled>
        设置
      </SideRailItem>
    </SideRail>
  );
}

describe("SideRail", () => {
  it("是一个有名称的导航地标，栏目排成一个列表", () => {
    render(<Rail />);
    const nav = screen.getByRole("navigation", { name: "主导航" });
    const list = within(nav).getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(nav).toHaveClass("sticky", "h-dvh", "z-(--z-nav)");
  });

  it("自上而下：标志、栏目、工具组、主行动块、次要入口", () => {
    render(<Rail />);
    const nav = screen.getByRole("navigation");
    const order = [
      screen.getByRole("link", { name: "第七勘探队" }),
      screen.getByRole("link", { name: "总览" }),
      screen.getByRole("button", { name: "切换主题" }),
      screen.getByRole("link", { name: "前往控制台" }),
      screen.getByText("v0.1"),
    ];
    for (const element of order) expect(nav).toContainElement(element);
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1]!.compareDocumentPosition(order[i]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("当前栏目输出 aria-current=page，左缘有一条短竖条", () => {
    render(<Rail />);
    const current = screen.getByRole("link", { name: /调度/ });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass("font-bold", "before:bg-ink");
    expect(screen.getByRole("link", { name: "总览" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("禁用的栏目去掉地址，标 aria-disabled", () => {
    render(<Rail />);
    const disabled = screen.getByRole("link", { name: "设置" });
    expect(disabled).not.toHaveAttribute("href");
    expect(disabled).toHaveAttribute("aria-disabled", "true");
  });

  it("默认展开：224px 宽，文字看得见，主行动块是通宽的横条", () => {
    render(<Rail />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("w-56");
    expect(nav).not.toHaveAttribute("data-collapsed");
    expect(screen.getByText("总览")).not.toHaveClass("sr-only");
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "前往控制台" })).toHaveAttribute(
      "data-layout",
      "block",
    );
  });

  it("收起：64px 宽，文字只留给读屏，行尾的补充不显示，主行动块竖排", () => {
    render(<Rail collapsed />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("w-16");
    expect(nav).toHaveAttribute("data-collapsed");
    // 看不见，但仍然是这一项的名称
    expect(screen.getByText("总览")).toHaveClass("sr-only");
    expect(screen.getByRole("link", { name: "总览" })).toBeInTheDocument();
    expect(screen.queryByText("12")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "前往控制台" })).toHaveAttribute(
      "data-layout",
      "stacked",
    );
  });

  it("收起时键盘聚焦到一项，栏目名浮出来；它只给眼睛看", async () => {
    const user = userEvent.setup();
    render(<Rail collapsed brand={undefined} />);
    await user.tab();
    const link = screen.getByRole("link", { name: "总览" });
    expect(link).toHaveFocus();

    const label = await waitFor(() => {
      const found = [
        ...document.body.querySelectorAll("[aria-hidden=true]"),
      ].find(
        (element) => element.textContent === "总览" && !link.contains(element),
      );
      expect(found).toBeTruthy();
      return found!;
    });
    expect(label).toHaveClass("bg-surface-muted");
    // 名称没有被读两遍
    expect(link).toHaveAccessibleName("总览");
  });

  it("展开时不浮出栏目名", async () => {
    const user = userEvent.setup();
    render(<Rail brand={undefined} />);
    await user.tab();
    expect(screen.getByRole("link", { name: "总览" })).toHaveFocus();
    expect(screen.getAllByText("总览")).toHaveLength(1);
  });

  it("没有地址的栏目传 onClick，是按钮；render 交给路由库的链接组件", async () => {
    const onClick = vi.fn();
    render(
      <SideRail aria-label="主导航">
        <SideRailItem icon={icon} onClick={onClick} current>
          打开设置
        </SideRailItem>
        <SideRailItem icon={icon} render={<RouterLink to="/archive" />} current>
          档案
        </SideRailItem>
      </SideRail>,
    );
    const button = screen.getByRole("button", { name: "打开设置" });
    expect(button).toHaveAttribute("aria-current", "page");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    const link = screen.getByRole("link", { name: "档案" });
    expect(link).toHaveAttribute("href", "/app/archive");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("分组：一个有名称的子列表；收起时小标题换成一条线", () => {
    const groups = (
      <>
        <SideRailGroup label="作业">
          <SideRailItem icon={icon} href="#dispatch">
            调度
          </SideRailItem>
        </SideRailGroup>
        <SideRailGroup label="资料">
          <SideRailItem icon={icon} href="#archive">
            档案
          </SideRailItem>
        </SideRailGroup>
      </>
    );
    const { rerender } = render(
      <SideRail aria-label="主导航">{groups}</SideRail>,
    );
    const group = screen.getByRole("list", { name: "作业" });
    expect(
      within(group).getByRole("link", { name: "调度" }),
    ).toBeInTheDocument();
    expect(screen.getByText("// 作业")).toHaveAttribute("aria-hidden", "true");

    rerender(
      <SideRail aria-label="主导航" collapsed>
        {groups}
      </SideRail>,
    );
    expect(screen.queryByText("// 作业")).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "作业" })).toBeInTheDocument();
  });

  it("className 可以覆盖默认的占满视口高", () => {
    render(<Rail className="h-full" />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("h-full");
    expect(nav).not.toHaveClass("h-dvh");
  });
});
