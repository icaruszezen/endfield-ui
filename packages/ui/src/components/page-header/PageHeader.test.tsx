import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RouterLink } from "../../test/RouterLink";
import { PageHeader, PageHeaderBack } from "./PageHeader";

describe("PageHeader", () => {
  it("是一个 header，标题默认是一级标题", () => {
    render(<PageHeader title="档案" />);
    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("heading", { level: 1, name: "档案" }),
    ).toBeInTheDocument();
  });

  it("level 换标题的层级", () => {
    render(<PageHeader title="批次详情" level={2} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "批次详情" }),
    ).toBeInTheDocument();
  });

  it("各格按顺序排：面包屑、微文字行、返回、标题、说明、行动、下面的一行", () => {
    render(
      <PageHeader
        breadcrumb={<nav aria-label="面包屑">路径</nav>}
        meta="// ARCHIVE"
        back={<PageHeaderBack />}
        title="档案"
        description="按站点和月份归档。"
        actions={<button type="button">新建记录</button>}
      >
        <p>下面的一行</p>
      </PageHeader>,
    );
    const header = screen.getByRole("banner");
    const order = [
      screen.getByRole("navigation", { name: "面包屑" }),
      screen.getByText("// ARCHIVE"),
      screen.getByRole("button", { name: "返回" }),
      screen.getByRole("heading", { name: "档案" }),
      screen.getByText("按站点和月份归档。"),
      screen.getByRole("button", { name: "新建记录" }),
      screen.getByText("下面的一行"),
    ];
    for (const node of order) expect(header).toContainElement(node);
    for (let index = 1; index < order.length; index += 1) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("没给的格子不留空壳", () => {
    const { container } = render(<PageHeader title="档案" />);
    expect(container.querySelector("[data-actions]")).toBeNull();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("divider 加一条底线；sticky 吸顶并自带实底和底线", () => {
    const { rerender } = render(<PageHeader title="档案" divider />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("border-b", "border-line");
    expect(header).not.toHaveClass("sticky");

    rerender(<PageHeader title="档案" sticky />);
    expect(header).toHaveClass("sticky", "top-0", "bg-surface", "border-b");
    expect(header).toHaveAttribute("data-sticky");
  });

  it("className 能改吸顶的位置；其余属性落在 header 上", () => {
    render(
      <PageHeader title="档案" sticky className="top-14" id="page-header" />,
    );
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("top-14");
    expect(header).not.toHaveClass("top-0");
    expect(header).toHaveAttribute("id", "page-header");
  });

  it("入场：微文字行 → 标题 → 说明依次晚 100ms，从左边来；能点的不参加", () => {
    render(
      <PageHeader
        breadcrumb={<nav aria-label="面包屑">路径</nav>}
        meta="// ARCHIVE"
        back={<PageHeaderBack />}
        title="档案"
        description="按站点和月份归档。"
        actions={<button type="button">新建记录</button>}
      />,
    );
    const enter = [
      "animate-shift-in",
      "[--shift-x:calc(var(--motion-shift-lg)*-1)]",
    ];
    const meta = screen.getByText("// ARCHIVE");
    const heading = screen.getByRole("heading");
    const description = screen.getByText("按站点和月份归档。");
    expect(meta).toHaveClass(...enter);
    expect(meta.className).not.toMatch(/animation-delay/);
    expect(heading).toHaveClass(...enter, "[animation-delay:100ms]");
    expect(description).toHaveClass(...enter, "[animation-delay:200ms]");

    const header = screen.getByRole("banner");
    expect(header.className).not.toMatch(/animate-/);
    for (const still of [
      screen.getByRole("navigation", { name: "面包屑" }),
      screen.getByRole("button", { name: "返回" }).parentElement!,
      header.querySelector("[data-actions]")!,
    ]) {
      expect(still.className).not.toMatch(/animate-/);
    }
  });

  it("入场：没有微文字行时从标题起", () => {
    render(<PageHeader title="档案" description="按站点和月份归档。" />);
    const heading = screen.getByRole("heading");
    expect(heading).toHaveClass("animate-shift-in");
    expect(heading.className).not.toMatch(/animation-delay/);
    expect(screen.getByText("按站点和月份归档。")).toHaveClass(
      "[animation-delay:100ms]",
    );
  });

  it("吸顶的页头、animate=false 的页头不播", () => {
    const { rerender } = render(
      <PageHeader title="档案" meta="// ARCHIVE" description="说明" sticky />,
    );
    const header = screen.getByRole("banner");
    expect(header.innerHTML).not.toMatch(/animate-/);

    rerender(
      <PageHeader
        title="档案"
        meta="// ARCHIVE"
        description="说明"
        animate={false}
      />,
    );
    expect(header.innerHTML).not.toMatch(/animate-/);
    // animate 不落到 DOM 上
    expect(header).not.toHaveAttribute("animate");
  });
});

describe("PageHeaderBack", () => {
  it("默认是一个名为“返回”的按钮，点了触发 onClick", async () => {
    const onClick = vi.fn();
    render(<PageHeaderBack onClick={onClick} />);
    const back = screen.getByRole("button", { name: "返回" });
    expect(back).toHaveAttribute("type", "button");
    await userEvent.click(back);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("aria-label 换名称", () => {
    render(<PageHeaderBack aria-label="返回档案" />);
    expect(
      screen.getByRole("button", { name: "返回档案" }),
    ).toBeInTheDocument();
  });

  it("传了 href 就是链接", () => {
    render(<PageHeaderBack href="/archive" aria-label="返回档案" />);
    const back = screen.getByRole("link", { name: "返回档案" });
    expect(back).toHaveAttribute("href", "/archive");
  });

  it("render 换成路由库的链接组件，类名和名称合并过去", () => {
    render(
      <PageHeaderBack
        render={<RouterLink to="/archive" />}
        aria-label="返回档案"
      />,
    );
    const back = screen.getByRole("link", { name: "返回档案" });
    expect(back).toHaveAttribute("href", "/app/archive");
    expect(back).toHaveAttribute("data-router-link");
    expect(back).toHaveClass("size-10");
  });

  it("禁用的按钮点不动", async () => {
    const onClick = vi.fn();
    render(<PageHeaderBack disabled onClick={onClick} />);
    const back = screen.getByRole("button", { name: "返回" });
    expect(back).toBeDisabled();
    await userEvent.click(back);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("禁用的链接去掉地址，仍然读得出是一个不可用的链接", () => {
    render(<PageHeaderBack href="/archive" disabled />);
    const back = screen.getByRole("link", { name: "返回" });
    expect(back).not.toHaveAttribute("href");
    expect(back).toHaveAttribute("aria-disabled", "true");
  });

  it("箭头只是画的，对读屏隐藏", () => {
    render(<PageHeaderBack />);
    const icon = screen.getByRole("button").querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
