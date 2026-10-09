import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel, PanelBody, PanelHeader, PanelRow, PanelRows } from "./Panel";

describe("Panel", () => {
  it("标题默认是 h3，level 可改", () => {
    const { rerender } = render(
      <Panel>
        <PanelHeader>基础属性</PanelHeader>
      </Panel>,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "基础属性" }),
    ).toBeInTheDocument();

    rerender(
      <Panel>
        <PanelHeader level={2}>基础属性</PanelHeader>
      </Panel>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("extra 渲染在标题旁，且不进入标题文字", () => {
    render(
      <Panel>
        <PanelHeader extra={<span>4 项</span>}>基础属性</PanelHeader>
      </Panel>,
    );
    expect(screen.getByRole("heading")).toHaveTextContent(/^基础属性$/);
    expect(screen.getByText("4 项")).toBeInTheDocument();
  });

  it("band 标题带是一个反转主题，里面用普通的 surface / ink；line 不是", () => {
    const { rerender } = render(
      <Panel>
        <PanelHeader data-testid="header">基础属性</PanelHeader>
      </Panel>,
    );
    const header = () => screen.getByTestId("header");
    expect(header()).toHaveAttribute("data-theme", "inverse");
    expect(header()).toHaveClass("bg-surface", "text-ink");
    // 左端的竖条跟着这块底取强调色
    expect(header().querySelector("[aria-hidden]")).toHaveClass(
      "bg-accent-ink",
    );

    rerender(
      <Panel>
        <PanelHeader variant="line" data-testid="header">
          基础属性
        </PanelHeader>
      </Panel>,
    );
    expect(header()).not.toHaveAttribute("data-theme");
    expect(header().querySelector("[aria-hidden]")).toBeNull();
  });

  it("bordered=false 去掉描边", () => {
    render(
      <Panel bordered={false} data-testid="panel">
        <PanelBody>内容</PanelBody>
      </Panel>,
    );
    expect(screen.getByTestId("panel")).not.toHaveClass("border");
  });

  it("属性行输出 dl / dt / dd 语义", () => {
    render(
      <Panel>
        <PanelRows>
          <PanelRow label="生命值">5,495</PanelRow>
          <PanelRow label="攻击力">312</PanelRow>
        </PanelRows>
      </Panel>,
    );
    const term = screen.getByText("生命值");
    expect(term.tagName).toBe("DT");
    expect(screen.getByText("5,495").tagName).toBe("DD");
    expect(term.closest("dl")).not.toBeNull();
  });
});
