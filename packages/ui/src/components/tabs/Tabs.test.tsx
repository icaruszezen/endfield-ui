import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Tab, TabList, TabPanel, Tabs } from "./Tabs";

function Example(props: { onValueChange?: (value: string) => void }) {
  return (
    <Tabs defaultValue="news" onValueChange={props.onValueChange}>
      <TabList aria-label="情报分类">
        <Tab value="news">新闻</Tab>
        <Tab value="notice">公告</Tab>
        <Tab value="event" disabled>
          活动
        </Tab>
        <Tab value="media">影像</Tab>
      </TabList>
      <TabPanel value="news">新闻内容</TabPanel>
      <TabPanel value="notice">公告内容</TabPanel>
      <TabPanel value="event">活动内容</TabPanel>
      <TabPanel value="media">影像内容</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("输出 tablist / tab / tabpanel 语义并互相关联", () => {
    render(<Example />);
    expect(
      screen.getByRole("tablist", { name: "情报分类" }),
    ).toBeInTheDocument();

    const tab = screen.getByRole("tab", { name: "新闻" });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
    expect(panel).toHaveTextContent("新闻内容");
  });

  it("只有选中的页签在 Tab 序列里", () => {
    render(<Example />);
    expect(screen.getByRole("tab", { name: "新闻" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("tab", { name: "公告" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("点击切换页签并通知 onValueChange", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole("tab", { name: "公告" }));
    expect(screen.getByRole("tab", { name: "公告" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("公告内容");
    expect(onValueChange).toHaveBeenCalledWith("notice");
  });

  it("再次点击当前页签不重复通知", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "新闻" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("方向键移动并切换，跳过禁用项，首尾循环", async () => {
    render(<Example />);
    screen.getByRole("tab", { name: "新闻" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "公告" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("公告内容");

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "影像" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "新闻" })).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "影像" })).toHaveFocus();
  });

  it("Home / End 跳到首尾", async () => {
    render(<Example />);
    screen.getByRole("tab", { name: "新闻" }).focus();

    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "影像" })).toHaveFocus();

    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "新闻" })).toHaveFocus();
  });

  it("禁用的页签点不动", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("tab", { name: "活动" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("新闻内容");
  });

  it("受控用法由外部决定当前页签", async () => {
    function Controlled() {
      const [value, setValue] = useState("a");
      return (
        <Tabs value={value} onValueChange={setValue}>
          <TabList>
            <Tab value="a">甲</Tab>
            <Tab value="b">乙</Tab>
          </TabList>
          <TabPanel value="a">甲内容</TabPanel>
          <TabPanel value="b">乙内容</TabPanel>
        </Tabs>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("tab", { name: "乙" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("乙内容");
  });

  it("面板：一开始选中的那一块不淡入，切过来的才淡入，切回去也是", async () => {
    render(<Example />);
    expect(screen.getByRole("tabpanel")).not.toHaveClass("animate-fade-in");

    await userEvent.click(screen.getByRole("tab", { name: "公告" }));
    const notice = screen.getByRole("tabpanel");
    expect(notice).toHaveTextContent("公告内容");
    expect(notice).toHaveClass(
      "animate-fade-in",
      "[animation-duration:var(--duration-fast)]",
    );

    await userEvent.click(screen.getByRole("tab", { name: "新闻" }));
    const news = screen.getByRole("tabpanel");
    expect(news).toHaveTextContent("新闻内容");
    expect(news).toHaveClass("animate-fade-in");
    // 藏起来的那一块不带着动画的类：下次再出来才会重新播
    expect(notice).not.toHaveClass("animate-fade-in");
  });

  it("面板：受控时同样只在换过之后淡入", () => {
    const { rerender } = render(
      <Tabs value="a">
        <TabList aria-label="示例">
          <Tab value="a">甲</Tab>
          <Tab value="b">乙</Tab>
        </TabList>
        <TabPanel value="a">甲的内容</TabPanel>
        <TabPanel value="b">乙的内容</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole("tabpanel")).not.toHaveClass("animate-fade-in");

    rerender(
      <Tabs value="b">
        <TabList aria-label="示例">
          <Tab value="a">甲</Tab>
          <Tab value="b">乙</Tab>
        </TabList>
        <TabPanel value="a">甲的内容</TabPanel>
        <TabPanel value="b">乙的内容</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole("tabpanel")).toHaveClass("animate-fade-in");
  });

  it("页签值里的特殊字符不会破坏 id 关联", () => {
    render(
      <Tabs defaultValue="a b/c">
        <TabList>
          <Tab value="a b/c">甲</Tab>
        </TabList>
        <TabPanel value="a b/c">内容</TabPanel>
      </Tabs>,
    );
    const tab = screen.getByRole("tab");
    expect(tab.id).not.toMatch(/[\s/]/);
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "aria-labelledby",
      tab.id,
    );
  });

  it("脱离 Tabs 使用时给出明确的报错", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Tab value="a">甲</Tab>)).toThrow(/<Tabs>/);
    spy.mockRestore();
  });

  it("wedge 变体：语义与键盘不变，选中项是楔形", async () => {
    render(
      <Tabs defaultValue="depot" variant="wedge">
        <TabList aria-label="仓库分类">
          <Tab value="depot">物资</Tab>
          <Tab value="gear">装备</Tab>
          <Tab value="sealed" disabled>
            封存
          </Tab>
        </TabList>
        <TabPanel value="depot">物资内容</TabPanel>
        <TabPanel value="gear">装备内容</TabPanel>
        <TabPanel value="sealed">封存内容</TabPanel>
      </Tabs>,
    );

    const depot = screen.getByRole("tab", { name: "物资" });
    const gear = screen.getByRole("tab", { name: "装备" });
    expect(depot).toHaveAttribute("aria-selected", "true");
    expect(depot).toHaveClass("before:wedge-r", "before:bg-action");
    expect(gear).not.toHaveClass("before:bg-action");
    expect(screen.getByRole("tab", { name: "封存" })).toBeDisabled();

    depot.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(gear).toHaveFocus();
    expect(gear).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("装备内容");

    // 禁用的页签被方向键跳过
    await userEvent.keyboard("{ArrowRight}");
    expect(depot).toHaveFocus();
  });
});
