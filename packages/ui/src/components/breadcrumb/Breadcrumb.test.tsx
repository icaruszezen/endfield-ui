import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";

function Example({ maxItems }: { maxItems?: number }) {
  return (
    <Breadcrumb maxItems={maxItems}>
      <BreadcrumbItem href="/archive">档案</BreadcrumbItem>
      <BreadcrumbItem href="/archive/region">区域</BreadcrumbItem>
      <BreadcrumbItem href="/archive/region/station">站点</BreadcrumbItem>
      <BreadcrumbItem href="/archive/region/station/log">记录</BreadcrumbItem>
      <BreadcrumbItem current>详情</BreadcrumbItem>
    </Breadcrumb>
  );
}

describe("Breadcrumb", () => {
  it("是一个带名称的导航地标，里面是有序列表", () => {
    render(<Example />);
    const nav = screen.getByRole("navigation", { name: "面包屑" });
    expect(nav.querySelector("ol")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("有 href 的项是链接，当前项不是链接并带 aria-current", () => {
    render(<Example />);
    expect(screen.getByRole("link", { name: "档案" })).toHaveAttribute(
      "href",
      "/archive",
    );
    expect(screen.queryByRole("link", { name: "详情" })).toBeNull();
    expect(screen.getByText("详情")).toHaveAttribute("aria-current", "page");
  });

  it("斜杠是装饰，对读屏隐藏", () => {
    render(<Example />);
    for (const mark of screen.getAllByText(/^\/{1,2}$/)) {
      expect(mark).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("超过 maxItems 时折叠中间项，保留首项和靠后的几项", () => {
    render(<Example maxItems={3} />);
    expect(screen.getByRole("link", { name: "档案" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "区域" })).toBeNull();
    expect(screen.queryByRole("link", { name: "站点" })).toBeNull();
    expect(screen.getByRole("link", { name: "记录" })).toBeInTheDocument();
    expect(screen.getByText("详情")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "显示完整路径" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("点击 … 展开全部，并把焦点交给第一个露出来的链接", async () => {
    render(<Example maxItems={3} />);
    await userEvent.click(screen.getByRole("button", { name: "显示完整路径" }));

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "区域" })).toHaveFocus();
  });

  it("项数没超过 maxItems 时不折叠", () => {
    render(<Example maxItems={5} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
