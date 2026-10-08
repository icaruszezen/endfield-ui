import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Navigator } from "./Navigator";

const zones = ["谷地", "第七勘探区", "荒原", "旧输料口"];

const prev = () => screen.getByRole("button", { name: "上一项" });
const next = () => screen.getByRole("button", { name: "下一项" });
const currentName = () =>
  screen.getByRole("group").querySelector("[data-current]");

describe("Navigator", () => {
  it("是一个带名称的分组，显示计数和当前条目的名称", () => {
    render(<Navigator aria-label="勘探区" items={zones} />);
    const group = screen.getByRole("group", { name: "勘探区" });
    expect(group).toHaveTextContent("1/4");
    expect(currentName()).toHaveTextContent("谷地");
  });

  it("看得见的计数对读屏隐藏，换成一句完整的话", () => {
    render(<Navigator aria-label="勘探区" items={zones} defaultIndex={1} />);
    expect(screen.getByText("2/4")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("第 2 项，共 4 项")).toBeInTheDocument();
  });

  it("计数与名称在一个 polite 的播报区里", () => {
    render(<Navigator aria-label="勘探区" items={zones} />);
    const live = currentName()?.closest("[aria-live]");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toContainElement(screen.getByText("1/4"));
  });

  it("只有当前条目的名称可见，其余的只用来占宽度", () => {
    render(<Navigator aria-label="勘探区" items={zones} />);
    expect(screen.getByText("谷地")).not.toHaveClass("invisible");
    expect(screen.getByText("第七勘探区")).toHaveClass("invisible");
    expect(screen.getByText("荒原")).toHaveClass("invisible");
  });

  it("非受控：前后切换，并通知 onIndexChange", async () => {
    const onIndexChange = vi.fn();
    render(
      <Navigator
        aria-label="勘探区"
        items={zones}
        onIndexChange={onIndexChange}
      />,
    );

    await userEvent.click(next());
    expect(currentName()).toHaveTextContent("第七勘探区");
    expect(onIndexChange).toHaveBeenLastCalledWith(1);

    await userEvent.click(prev());
    expect(currentName()).toHaveTextContent("谷地");
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it("默认到头时按钮禁用", async () => {
    render(<Navigator aria-label="勘探区" items={zones} defaultIndex={2} />);
    expect(prev()).toBeEnabled();
    expect(next()).toBeEnabled();

    await userEvent.click(next());
    expect(next()).toBeDisabled();
  });

  it("loop：首尾相接", async () => {
    render(<Navigator aria-label="勘探区" items={zones} loop />);
    expect(prev()).toBeEnabled();

    await userEvent.click(prev());
    expect(currentName()).toHaveTextContent("旧输料口");
    expect(screen.getByText("4/4")).toBeInTheDocument();

    await userEvent.click(next());
    expect(currentName()).toHaveTextContent("谷地");
  });

  it("受控：位置由外面决定", async () => {
    function Controlled() {
      const [index, setIndex] = useState(1);
      return (
        <Navigator
          aria-label="勘探区"
          items={zones}
          index={index}
          onIndexChange={setIndex}
        />
      );
    }
    render(<Controlled />);
    await userEvent.click(next());
    expect(currentName()).toHaveTextContent("荒原");
  });

  it("只有一项时两个按钮都禁用，开了 loop 也一样", () => {
    render(<Navigator aria-label="勘探区" items={["谷地"]} loop />);
    expect(prev()).toBeDisabled();
    expect(next()).toBeDisabled();
  });

  it("越界的 index 被夹回范围内", () => {
    render(<Navigator aria-label="勘探区" items={zones} index={9} />);
    expect(currentName()).toHaveTextContent("旧输料口");
    expect(screen.getByText("4/4")).toBeInTheDocument();
  });
});
