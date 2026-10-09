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
import { SideRailSub, SideRailSubItem } from "./SideRailSub";

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

function TreeRail({
  current = "people",
  ...props
}: Partial<SideRailProps> & {
  current?: string | null;
  subProps?: Partial<React.ComponentProps<typeof SideRailSub>>;
}) {
  const { subProps, ...rail } = props;
  return (
    <SideRail aria-label="主导航" {...rail}>
      <SideRailItem icon={icon} href="#overview">
        总览
      </SideRailItem>
      <SideRailSub icon={icon} label="档案" {...subProps}>
        <SideRailSubItem href="#people" current={current === "people"}>
          人员
        </SideRailSubItem>
        <SideRailSubItem
          href="#stations"
          current={current === "stations"}
          end={<span>26</span>}
        >
          站点
        </SideRailSubItem>
        <SideRailSubItem href="#routes" disabled>
          线路
        </SideRailSubItem>
      </SideRailSub>
    </SideRail>
  );
}

describe("SideRailSub", () => {
  it("父项是一个报告展开状态的按钮，子项是一个以它命名的子列表", () => {
    render(<TreeRail />);
    const parent = screen.getByRole("button", { name: "档案" });
    // 当前项在里面：默认展开
    expect(parent).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("list", { name: "档案" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByRole("link", { name: "人员" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // 父项不是页面
    expect(parent).not.toHaveAttribute("aria-current");
  });

  it("当前项不在里面时默认收着；点父项展开", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<TreeRail current={null} subProps={{ onOpenChange }} />);
    const parent = screen.getByRole("button", { name: "档案" });
    expect(parent).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: "人员" }),
    ).not.toBeInTheDocument();

    await user.click(parent);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(parent).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "人员" })).toBeInTheDocument();
  });

  it("短竖条只出现一处：展开时在子项上，收着时父项替它显示", async () => {
    const user = userEvent.setup();
    render(<TreeRail />);
    const parent = screen.getByRole("button", { name: "档案" });
    const bar = "before:bg-ink";
    expect(parent).not.toHaveClass(bar);
    expect(screen.getByRole("link", { name: "人员" })).toHaveClass(bar);
    // 展开着父项也不退回次要色
    expect(parent).toHaveClass("text-ink");

    await user.click(parent);
    await waitFor(() =>
      expect(parent).toHaveAttribute("aria-expanded", "false"),
    );
    expect(parent).toHaveClass(bar, "font-bold");
  });

  it("受控：展开不展开由外面决定", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<TreeRail subProps={{ open: false, onOpenChange }} />);
    const parent = screen.getByRole("button", { name: "档案" });
    expect(parent).toHaveAttribute("aria-expanded", "false");
    await user.click(parent);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(parent).toHaveAttribute("aria-expanded", "false");
  });

  it("子项：行尾的补充、禁用、按钮形态和 render", () => {
    render(
      <SideRail aria-label="主导航">
        <SideRailSub icon={icon} label="档案" defaultOpen>
          <SideRailSubItem href="#stations" end={<span>26</span>}>
            站点
          </SideRailSubItem>
          <SideRailSubItem href="#routes" disabled>
            线路
          </SideRailSubItem>
          <SideRailSubItem onClick={() => {}}>导出</SideRailSubItem>
          <SideRailSubItem render={<RouterLink to="/logs" />}>
            日志
          </SideRailSubItem>
        </SideRailSub>
      </SideRail>,
    );
    expect(
      screen.getByRole("link", { name: /^站点 ?26$/ }),
    ).toBeInTheDocument();
    const disabled = screen.getByRole("link", { name: "线路" });
    expect(disabled).not.toHaveAttribute("href");
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "导出" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "日志" })).toHaveAttribute(
      "href",
      "/app/logs",
    );
  });

  it("收起的侧轨：父项只剩图标，点开是一块以它命名的菜单，子项是菜单项", async () => {
    const user = userEvent.setup();
    render(<TreeRail collapsed />);
    const parent = screen.getByRole("button", { name: "档案" });
    expect(parent).toHaveAttribute("aria-haspopup", "menu");
    // 当前项藏在菜单里：父项替它显示成当前的样子
    expect(parent).toHaveClass("before:bg-ink", "font-bold");
    expect(
      screen.queryByRole("list", { name: "档案" }),
    ).not.toBeInTheDocument();

    await user.click(parent);
    const menu = await screen.findByRole("menu");
    expect(
      within(menu).getByRole("group", { name: "档案" }),
    ).toBeInTheDocument();
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "人员",
      "站点26",
      "线路",
    ]);
    expect(items[0]).toHaveAttribute("aria-current", "page");
    expect(items[0]).toHaveAttribute("href", "#people");
    expect(items[2]).toHaveAttribute("aria-disabled", "true");
    expect(items[2]).not.toHaveAttribute("href");
  });

  it("收起的侧轨：键盘打开菜单，Esc 关闭后焦点回到父项", async () => {
    const user = userEvent.setup();
    render(<TreeRail collapsed />);
    const parent = screen.getByRole("button", { name: "档案" });
    parent.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "人员" })).toHaveFocus(),
    );
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(parent).toHaveFocus();
  });
});
