import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { Slider } from "./Slider";

describe("Slider", () => {
  it("是一个有名称的原生范围输入，带上下限和当前值", () => {
    render(
      <Slider aria-label="音量" defaultValue={40} min={0} max={100} step={5} />,
    );
    const slider = screen.getByRole("slider", { name: "音量" });
    expect(slider.tagName).toBe("INPUT");
    expect(slider).toHaveAttribute("type", "range");
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "100");
    expect(slider).toHaveAttribute("aria-valuenow", "40");
  });

  it("键盘：方向键走一步，PageUp / PageDown 走一大步，Home / End 到两端", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();
    render(
      <Slider
        aria-label="音量"
        defaultValue={40}
        step={5}
        largeStep={20}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />,
    );
    const slider = screen.getByRole("slider");
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(45);
    expect(onValueCommitted).toHaveBeenLastCalledWith(45);
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith(35);
    await user.keyboard("{PageUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(55);
    await user.keyboard("{PageDown}");
    expect(onValueChange).toHaveBeenLastCalledWith(35);
    await user.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith(100);
    await user.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    expect(slider).toHaveAttribute("aria-valuenow", "0");
  });

  it("受控：值由外面决定", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState(10);
      return (
        <>
          <Slider aria-label="缩放" value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("12");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "12");
  });

  it("showValue：右侧显示当前值，format 决定怎么写", () => {
    render(
      <Slider
        aria-label="透明度"
        defaultValue={0.4}
        min={0}
        max={1}
        step={0.05}
        showValue
        format={{ style: "percent" }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("40%");
  });

  it("范围滑块：一个有名称的分组里两个滑块，值是两个数", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider
        aria-label="载重范围"
        defaultValue={[20, 60]}
        showValue
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole("group", { name: "载重范围" })).toBeInTheDocument();
    const low = screen.getByRole("slider", { name: "最小值" });
    const high = screen.getByRole("slider", { name: "最大值" });
    expect(low).toHaveAttribute("aria-valuenow", "20");
    expect(high).toHaveAttribute("aria-valuenow", "60");
    expect(screen.getByRole("status")).toHaveTextContent("20 – 60");

    await user.tab();
    expect(low).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith([21, 60]);
    await user.tab();
    expect(high).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith([21, 59]);
  });

  it("范围滑块：两个滑块互相推不过去", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider
        aria-label="载重范围"
        defaultValue={[58, 60]}
        minStepsBetweenValues={1}
        thumbLabels={["下限", "上限"]}
        onValueChange={onValueChange}
      />,
    );
    const low = screen.getByRole("slider", { name: "下限" });
    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(low).toHaveAttribute("aria-valuenow", "59");
    expect(screen.getByRole("slider", { name: "上限" })).toHaveAttribute(
      "aria-valuenow",
      "60",
    );
  });

  it("带 name 时值随表单提交；范围滑块提交两个同名的值", () => {
    render(
      <form data-testid="form">
        <Slider aria-label="音量" name="volume" defaultValue={40} />
        <Slider aria-label="范围" name="range" defaultValue={[20, 60]} />
      </form>,
    );
    const data = new FormData(screen.getByTestId<HTMLFormElement>("form"));
    expect(data.get("volume")).toBe("40");
    expect(data.getAll("range")).toEqual(["20", "60"]);
  });

  it("放进 Field：名称来自标签，帮助文字关联上，禁用跟着字段", () => {
    const { rerender } = render(
      <Field label="界面缩放" help="只影响这台设备">
        <Slider defaultValue={100} min={80} max={140} />
      </Field>,
    );
    const slider = screen.getByRole("slider", { name: "界面缩放" });
    expect(slider).toHaveAccessibleDescription("只影响这台设备");
    expect(slider).toBeEnabled();

    rerender(
      <Field label="界面缩放" disabled>
        <Slider defaultValue={100} min={80} max={140} />
      </Field>,
    );
    expect(screen.getByRole("slider", { name: "界面缩放" })).toBeDisabled();
  });

  it("禁用时是一个禁用的原生输入：焦点到不了它", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="音量" defaultValue={40} disabled />);
    const slider = screen.getByRole("slider");
    expect(slider).toBeDisabled();
    await user.tab();
    expect(slider).not.toHaveFocus();
  });

  it("marks：刻度是装饰，按值在轨道上落位", () => {
    render(
      <Slider
        aria-label="音量"
        defaultValue={50}
        marks={[
          { value: 0, label: "静音" },
          { value: 50, label: "50" },
          { value: 100, label: "最大" },
        ]}
      />,
    );
    const middle = screen.getByText("50", { selector: "span" });
    expect(middle.closest("[aria-hidden=true]")).toBeInTheDocument();
    // 轨道两端各缩进 6px，刻度按同样的算法落位
    expect(middle.style.left).toContain("6px + 0.5 *");
    expect(screen.getByText("最大").style.left).toContain("6px + 1 *");
  });

  it("两档尺寸", () => {
    const { container, rerender } = render(
      <Slider aria-label="音量" defaultValue={40} />,
    );
    expect(container.firstElementChild).toHaveAttribute("data-size", "md");
    expect(container.querySelector(".h-10")).toBeInTheDocument();
    rerender(<Slider aria-label="音量" defaultValue={40} size="sm" />);
    expect(container.querySelector(".h-8")).toBeInTheDocument();
  });
});
