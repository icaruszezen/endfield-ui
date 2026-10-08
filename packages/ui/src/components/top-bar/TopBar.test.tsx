import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavAction } from "../nav-action/NavAction";
import { TopBar } from "./TopBar";

describe("TopBar", () => {
  it("是页面的页眉；从左到右是标志、工具、主行动、菜单钮", () => {
    render(
      <TopBar
        brand={<a href="#home">第七勘探队</a>}
        tools={<button type="button">切换主题</button>}
        action={<NavAction href="#console">控制台</NavAction>}
        menu={<button type="button">打开菜单</button>}
      />,
    );
    const bar = screen.getByRole("banner");
    const order = [
      screen.getByRole("link", { name: "第七勘探队" }),
      screen.getByRole("button", { name: "切换主题" }),
      screen.getByRole("link", { name: "控制台" }),
      screen.getByRole("button", { name: "打开菜单" }),
    ];
    for (const element of order) expect(bar).toContainElement(element);
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1]!.compareDocumentPosition(order[i]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("56px 高，贴在顶上，在常驻导航那一层", () => {
    render(<TopBar />);
    expect(screen.getByRole("banner")).toHaveClass(
      "sticky",
      "top-0",
      "h-14",
      "z-(--z-nav)",
      "border-b",
    );
  });

  it("里面的主行动块是 40px 高的横块", () => {
    render(<TopBar action={<NavAction>控制台</NavAction>} />);
    expect(screen.getByRole("button", { name: "控制台" })).toHaveAttribute(
      "data-layout",
      "inline",
    );
  });

  it("子元素放在标志和工具之间；className 可以覆盖内置类", () => {
    render(
      <TopBar brand={<span>标志</span>} className="static">
        <h1>调度台</h1>
      </TopBar>,
    );
    const bar = screen.getByRole("banner");
    expect(bar).toHaveClass("static");
    expect(bar).not.toHaveClass("sticky");
    expect(screen.getByRole("heading", { name: "调度台" })).toBeInTheDocument();
  });
});
