import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { Radio, RadioGroup } from "./Radio";

function Example(props: {
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <RadioGroup
      aria-label="测绘精度"
      defaultValue="standard"
      onValueChange={props.onValueChange}
      disabled={props.disabled}
    >
      <Radio value="draft">草图</Radio>
      <Radio value="standard">标准</Radio>
      <Radio value="fine">精细</Radio>
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("输出 radiogroup 语义，组内的单选共用一个 name", () => {
    render(<Example />);
    expect(
      screen.getByRole("radiogroup", { name: "测绘精度" }),
    ).toBeInTheDocument();

    const names = screen
      .getAllByRole("radio")
      .map((radio) => radio.getAttribute("name"));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it("都没选时不带半选的样式：未选的一组单选会命中 :indeterminate", () => {
    render(
      <RadioGroup aria-label="选项">
        <Radio value="a">甲</Radio>
        <Radio value="b">乙</Radio>
      </RadioGroup>,
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
      expect(radio.className).not.toMatch(/indeterminate:/);
    }
  });

  it("defaultValue 决定初始选中", () => {
    render(<Example />);
    expect(screen.getByRole("radio", { name: "标准" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "草图" })).not.toBeChecked();
  });

  it("点击切换并通知 onValueChange；再点当前项不重复通知", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);

    await userEvent.click(screen.getByText("精细"));
    expect(screen.getByRole("radio", { name: "精细" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "标准" })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("fine");

    await userEvent.click(screen.getByText("精细"));
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it("受控用法由外部决定当前值", async () => {
    function Controlled() {
      const [value, setValue] = useState("a");
      return (
        <RadioGroup aria-label="选项" value={value} onValueChange={setValue}>
          <Radio value="a">甲</Radio>
          <Radio value="b">乙</Radio>
        </RadioGroup>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("radio", { name: "乙" }));
    expect(screen.getByRole("radio", { name: "乙" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "甲" })).not.toBeChecked();
  });

  it("受控但外部不更新时保持原状", async () => {
    render(
      <RadioGroup aria-label="选项" value="a">
        <Radio value="a">甲</Radio>
        <Radio value="b">乙</Radio>
      </RadioGroup>,
    );
    await userEvent.click(screen.getByRole("radio", { name: "乙" }));
    expect(screen.getByRole("radio", { name: "甲" })).toBeChecked();
  });

  it("整组禁用；单个 Radio 也可以单独禁用", async () => {
    const { unmount } = render(<Example disabled />);
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
    unmount();

    render(
      <RadioGroup aria-label="选项" defaultValue="a">
        <Radio value="a">甲</Radio>
        <Radio value="b" disabled>
          乙
        </Radio>
      </RadioGroup>,
    );
    await userEvent.click(screen.getByText("乙"));
    expect(screen.getByRole("radio", { name: "甲" })).toBeChecked();
  });

  it("可以指定表单字段名", () => {
    render(
      <RadioGroup aria-label="选项" name="precision" defaultValue="a">
        <Radio value="a">甲</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radio")).toHaveAttribute("name", "precision");
    expect(screen.getByRole("radio")).toHaveAttribute("value", "a");
  });

  it("在普通 Field 里：名称来自字段的标签，说明与错误态一并带上", () => {
    render(
      <Field label="测绘精度" error="请选择一项">
        <RadioGroup>
          <Radio value="a">甲</Radio>
        </RadioGroup>
      </Field>,
    );
    const group = screen.getByRole("radiogroup", { name: "测绘精度" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("请选择一项");
  });

  it("在 group Field 里：名称交给 fieldset 的 legend", () => {
    render(
      <Field group label="测绘精度">
        <RadioGroup>
          <Radio value="a">甲</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByRole("group", { name: "测绘精度" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });
});

describe("Radio", () => {
  it("脱离 RadioGroup 时是一个原生单选", async () => {
    render(
      <>
        <Radio name="solo" value="a" defaultChecked>
          甲
        </Radio>
        <Radio name="solo" value="b">
          乙
        </Radio>
      </>,
    );
    await userEvent.click(screen.getByText("乙"));
    expect(screen.getByRole("radio", { name: "乙" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "甲" })).not.toBeChecked();
  });
});
