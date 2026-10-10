import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { Segment, SegmentedControl } from "./SegmentedControl";

function Example(props: {
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <SegmentedControl
      aria-label="时间显示"
      defaultValue="24"
      name={props.name}
      onValueChange={props.onValueChange}
      disabled={props.disabled}
    >
      <Segment value="24">24 小时</Segment>
      <Segment value="12">12 小时</Segment>
      <Segment value="auto">跟随系统</Segment>
    </SegmentedControl>
  );
}

const segment = (name: string) => screen.getByRole("radio", { name });

describe("SegmentedControl", () => {
  it("语义是单选组：每一段是一个单选，共用一个 name", () => {
    render(<Example />);
    expect(
      screen.getByRole("radiogroup", { name: "时间显示" }),
    ).toBeInTheDocument();
    const names = screen
      .getAllByRole("radio")
      .map((radio) => radio.getAttribute("name"));
    expect(names).toHaveLength(3);
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it("defaultValue 决定初始选中；选中的那一段是填充反转", () => {
    render(<Example />);
    expect(segment("24 小时")).toBeChecked();
    expect(segment("12 小时")).not.toBeChecked();
    expect(segment("24 小时").closest("label")).toHaveClass(
      "bg-surface-inverse",
      "text-ink-inverse",
    );
    expect(segment("24 小时").closest("label")).toHaveAttribute(
      "data-selected",
    );
    expect(segment("12 小时").closest("label")).not.toHaveClass(
      "bg-surface-inverse",
    );
  });

  it("点击切换并通知 onValueChange；再点当前这一段不重复通知", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(segment("12 小时"));
    expect(segment("12 小时")).toBeChecked();
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("12");

    await userEvent.click(segment("12 小时"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("受控：值由外面给", async () => {
    function Controlled() {
      const [value, setValue] = useState("a");
      return (
        <>
          <SegmentedControl
            aria-label="视图"
            value={value}
            onValueChange={setValue}
          >
            <Segment value="a">网格</Segment>
            <Segment value="b">列表</Segment>
          </SegmentedControl>
          <button onClick={() => setValue("a")}>还原</button>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(segment("列表"));
    expect(segment("列表")).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "还原" }));
    expect(segment("网格")).toBeChecked();
  });

  it("选中的底：轨道上备着滑动的那一块；量不到位置时各段照旧自己画", () => {
    render(<Example />);
    const track = screen.getByRole("radiogroup");
    expect(track).toHaveClass(
      "after:bg-surface-inverse",
      "after:translate-x-(--indicator-x)",
      "after:w-(--indicator-w)",
      "data-indicator:after:block",
    );
    // jsdom 不排版：量不到，不标——选中的那一段自己的底还在
    expect(track).not.toHaveAttribute("data-indicator");
    expect(segment("24 小时").closest("label")).toHaveClass(
      "bg-surface-inverse",
      "in-data-indicator:bg-transparent",
    );
  });

  it("ref 给轨道，不顶掉它自己量位置用的那一个", () => {
    const rect = (left: number, width: number) => ({
      left,
      top: 0,
      width,
      height: 40,
      right: left + width,
      bottom: 40,
      x: left,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        if (this.getAttribute("role") === "radiogroup") return rect(0, 300);
        if (this.hasAttribute("data-selected")) return rect(100, 100);
        return rect(0, 0);
      },
    );
    const ref = { current: null as HTMLDivElement | null };
    render(
      <SegmentedControl aria-label="时间显示" defaultValue="12" ref={ref}>
        <Segment value="24">24 小时</Segment>
        <Segment value="12">12 小时</Segment>
      </SegmentedControl>,
    );
    const track = screen.getByRole("radiogroup");
    expect(ref.current).toBe(track);
    expect(track).toHaveAttribute("data-indicator", "on");
    expect(track.style.getPropertyValue("--indicator-x")).toBe("100px");
    vi.restoreAllMocks();
  });

  it("没给初始值时一个都不选", () => {
    render(
      <SegmentedControl aria-label="视图">
        <Segment value="a">网格</Segment>
        <Segment value="b">列表</Segment>
      </SegmentedControl>,
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("键盘：方向键换值", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.tab();
    expect(segment("24 小时")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(segment("12 小时")).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("12");
  });

  it("name：选中的值随表单提交", async () => {
    render(
      <form data-testid="form">
        <Example name="clock" />
      </form>,
    );
    const form = screen.getByTestId<HTMLFormElement>("form");
    expect(new FormData(form).get("clock")).toBe("24");
    await userEvent.click(segment("跟随系统"));
    expect(new FormData(form).get("clock")).toBe("auto");
  });

  it("整组禁用：点不动，选中的那一段换成禁用色", async () => {
    const onValueChange = vi.fn();
    render(<Example disabled onValueChange={onValueChange} />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
    await userEvent.click(segment("12 小时"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(segment("24 小时").closest("label")).toHaveClass(
      "bg-disabled",
      "text-on-disabled",
    );
  });

  it("单独禁用一段", async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="视图"
        defaultValue="a"
        onValueChange={onValueChange}
      >
        <Segment value="a">网格</Segment>
        <Segment value="b" disabled>
          看板
        </Segment>
      </SegmentedControl>,
    );
    expect(segment("看板")).toBeDisabled();
    expect(segment("网格")).not.toBeDisabled();
    await userEvent.click(segment("看板"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(segment("看板").closest("label")).toHaveClass("text-ink-disabled");
  });

  it("图标：只有图标的段用 aria-label 给名称", () => {
    render(
      <SegmentedControl aria-label="视图" defaultValue="grid">
        <Segment value="grid" aria-label="网格" icon={<svg />} />
        <Segment value="list" aria-label="列表" icon={<svg />} />
      </SegmentedControl>,
    );
    expect(segment("网格")).toBeChecked();
    expect(segment("列表")).toBeInTheDocument();
  });

  it("三档尺寸和输入框同高；outline 换成四边描边", () => {
    const { rerender } = render(
      <SegmentedControl aria-label="视图" size="sm">
        <Segment value="a">网格</Segment>
      </SegmentedControl>,
    );
    const group = () => screen.getByRole("radiogroup");
    expect(group()).toHaveClass("h-8", "border-b-2", "bg-surface-sunken");
    rerender(
      <SegmentedControl aria-label="视图" size="lg" variant="outline">
        <Segment value="a">网格</Segment>
      </SegmentedControl>,
    );
    expect(group()).toHaveClass("h-14", "border", "bg-surface");
    expect(group()).not.toHaveClass("border-b-2");
  });

  it("放进 Field：名称来自标签，帮助与错误关联上，错误态换成红线", () => {
    render(
      <Field label="时间显示" help="只影响这台终端。" error="请选一种。">
        <SegmentedControl>
          <Segment value="24">24 小时</Segment>
          <Segment value="12">12 小时</Segment>
        </SegmentedControl>
      </Field>,
    );
    const group = screen.getByRole("radiogroup", { name: "时间显示" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription(/请选一种/);
    expect(group).toHaveAccessibleDescription(/只影响这台终端/);
    expect(group).toHaveClass("border-danger");
  });

  it("Field 禁用、必填时跟着禁用、必填", () => {
    render(
      <Field label="时间显示" disabled required>
        <SegmentedControl defaultValue="24">
          <Segment value="24">24 小时</Segment>
        </SegmentedControl>
      </Field>,
    );
    expect(screen.getByRole("radio")).toBeDisabled();
    expect(screen.getByRole("radio")).toBeRequired();
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-required",
      "true",
    );
  });

  it("Segment 脱离 SegmentedControl 时报错", () => {
    const silence = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Segment value="a">网格</Segment>)).toThrow(
      /SegmentedControl/,
    );
    silence.mockRestore();
  });

  it("有焦点的那一段上有焦点环", () => {
    render(<Example />);
    expect(segment("24 小时").closest("label")).toHaveClass(
      "has-focus-visible:outline-2",
      "has-focus-visible:z-1",
    );
  });
});
