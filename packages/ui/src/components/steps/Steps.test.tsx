import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RouterLink } from "../../test/RouterLink";
import { Step, Steps } from "./Steps";

function Example({ current = 1 }: { current?: number }) {
  return (
    <Steps aria-label="建站流程" current={current}>
      <Step title="建站" description="选址与供电" />
      <Step title="测绘" />
      <Step title="复核" />
      <Step title="归档" />
    </Steps>
  );
}

const items = () => screen.getAllByRole("listitem");
const node = (item: HTMLElement) =>
  item.querySelector("[aria-hidden=true] > span")!;

describe("Steps", () => {
  it("是一张有名称的有序列表，一步一项", () => {
    render(<Example />);
    const list = screen.getByRole("list", { name: "建站流程" });
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  });

  it("状态由 current 和位置算出来：之前的已完成，当前的带 aria-current，之后的未到", () => {
    render(<Example current={1} />);
    expect(items().map((item) => item.dataset.status)).toEqual([
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
    expect(items()[1]).toHaveAttribute("aria-current", "step");
    expect(items()[0]).not.toHaveAttribute("aria-current");
    expect(items()[2]).not.toHaveAttribute("aria-current");
  });

  it("current 等于步数时全部是已完成，没有当前步", () => {
    render(<Example current={4} />);
    expect(items().every((item) => item.dataset.status === "done")).toBe(true);
    expect(items().some((item) => item.hasAttribute("aria-current"))).toBe(
      false,
    );
  });

  it("节点：已完成是墨底的勾，当前是黄块里的序号，未到是空心框里的序号", () => {
    render(<Example current={1} />);
    const [done, current, upcoming] = items();
    expect(node(done!)).toHaveClass(
      "bg-surface-inverse",
      "text-accent-ink-inverse",
    );
    expect(node(done!).querySelector("svg")).not.toBeNull();

    expect(node(current!)).toHaveClass("bg-action", "border-ink");
    expect(node(current!)).toHaveTextContent("02");

    expect(node(upcoming!)).toHaveClass("border-line-strong");
    expect(node(upcoming!)).toHaveTextContent("03");
    expect(node(upcoming!)).not.toHaveClass("bg-action");
  });

  it("节点和线对读屏隐藏；状态另有一句读屏才听得到的话", () => {
    render(<Example current={1} />);
    const [done, current, upcoming] = items();
    expect(done!.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(done).toHaveTextContent("已完成：建站");
    expect(current).toHaveTextContent("当前步骤：测绘");
    // 未到的不另说
    expect(upcoming!.querySelector(".sr-only")).toBeNull();
    expect(screen.getByText("已完成：")).toHaveClass("sr-only");
  });

  it("statusLabels 换掉那几句话", () => {
    render(
      <Steps
        aria-label="流程"
        current={1}
        statusLabels={{ done: "做完了", current: "正在做" }}
      >
        <Step title="建站" />
        <Step title="测绘" />
      </Steps>,
    );
    expect(items()[0]).toHaveTextContent("做完了：建站");
    expect(items()[1]).toHaveTextContent("正在做：测绘");
  });

  it("当前步的标题加粗，未到的降一档", () => {
    render(<Example current={1} />);
    expect(screen.getByText("测绘")).toHaveClass("font-bold", "text-ink");
    expect(screen.getByText("复核")).toHaveClass("text-ink-secondary");
  });

  it("连接线：走过的一段充满墨色，没到的是空的；最后一步后面没有线", () => {
    render(<Example current={1} />);
    const line = (item: HTMLElement) =>
      item.querySelector("[aria-hidden=true] > span:last-child")!;
    // 线自己一直是浅色，墨色在 ::before 上：充满还是收起由它的缩放决定
    expect(line(items()[0]!)).toHaveClass("bg-line-strong", "before:scale-100");
    expect(line(items()[1]!)).toHaveClass("bg-line-strong", "before:scale-0");
    expect(line(items()[0]!)).toHaveClass("before:transition-[scale]");
    expect(line(items()[3]!)).toHaveClass("group-last/step:hidden");
  });

  it("说明文字在标题下面", () => {
    render(<Example />);
    expect(screen.getByText("选址与供电")).toHaveClass("text-ink-secondary");
  });

  it("invalid：节点换成警示图标，状态里多一句「有误」，不改变它本来的状态", () => {
    render(
      <Steps aria-label="流程" current={2}>
        <Step title="建站" invalid />
        <Step title="测绘" />
        <Step title="复核" invalid />
      </Steps>,
    );
    const [first, , third] = items();
    expect(first).toHaveAttribute("data-status", "done");
    expect(first).toHaveAttribute("data-invalid");
    expect(node(first!)).toHaveClass("border-danger", "text-danger");
    expect(node(first!)).not.toHaveClass("bg-surface-inverse");
    expect(first).toHaveTextContent("已完成，有误：建站");

    expect(third).toHaveAttribute("aria-current", "step");
    expect(third).toHaveTextContent("当前步骤，有误：复核");
  });

  it("默认是纯文字：里面没有链接，也没有按钮", () => {
    render(<Example />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("href：标题是链接，点击范围铺满这一步，焦点环画在这一步上", () => {
    render(
      <Steps aria-label="流程" current={1}>
        <Step title="建站" href="/setup/site" />
        <Step title="测绘" />
      </Steps>,
    );
    const link = screen.getByRole("link", { name: "已完成：建站" });
    expect(link).toHaveAttribute("href", "/setup/site");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(link.closest("li")).toHaveClass("has-focus-visible:outline-2");
    expect(items()[1]).not.toHaveClass("has-focus-visible:outline-2");
  });

  it("render：换成路由库的链接组件", () => {
    render(
      <Steps aria-label="流程" current={1}>
        <Step title="建站" render={<RouterLink to="/setup/site" />} />
        <Step title="测绘" />
      </Steps>,
    );
    expect(screen.getByRole("link", { name: /建站/ })).toHaveAttribute(
      "href",
      "/app/setup/site",
    );
  });

  it("onClick：标题是按钮", async () => {
    const onClick = vi.fn();
    render(
      <Steps aria-label="流程" current={1}>
        <Step title="建站" onClick={onClick} />
        <Step title="测绘" />
      </Steps>,
    );
    const button = screen.getByRole("button", { name: "已完成：建站" });
    expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("横排在窄容器里退回竖排：横排的类都挂在容器查询上；vertical 没有这一层", () => {
    const { rerender } = render(<Example />);
    const list = () => screen.getByRole("list");
    expect(list().parentElement).toHaveClass("@container");
    expect(list()).toHaveClass("flex-col", "@md:flex-row");
    expect(items()[0]).toHaveClass("@md:flex-1", "@md:flex-col");

    rerender(
      <Steps aria-label="流程" current={0} orientation="vertical">
        <Step title="建站" />
      </Steps>,
    );
    expect(list()).toHaveClass("flex-col");
    expect(list()).not.toHaveClass("@md:flex-row");
    expect(list().parentElement).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("className 给最外面那层，其余属性给列表", () => {
    render(
      <Steps
        aria-label="流程"
        current={0}
        className="max-w-xl"
        data-testid="list"
      >
        <Step title="建站" />
      </Steps>,
    );
    const list = screen.getByTestId("list");
    expect(list.tagName).toBe("OL");
    expect(list.parentElement).toHaveClass("max-w-xl");
  });

  it("小一档：节点 20px", () => {
    render(
      <Steps aria-label="流程" current={0} size="sm">
        <Step title="建站" />
      </Steps>,
    );
    expect(node(items()[0]!)).toHaveClass("size-5");
  });

  it("Step 脱离 Steps 时报错", () => {
    const silence = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Step title="建站" />)).toThrow(/Steps/);
    silence.mockRestore();
  });
});
