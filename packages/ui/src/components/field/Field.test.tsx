import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../checkbox/Checkbox";
import { Input } from "../input/Input";
import { Radio, RadioGroup } from "../radio/Radio";
import { Textarea } from "../textarea/Textarea";
import { Field } from "./Field";

describe("Field", () => {
  it("标签与控件关联，点击标签聚焦控件", async () => {
    render(
      <Field label="代号">
        <Input />
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "代号" });
    await userEvent.click(screen.getByText("代号"));
    expect(input).toHaveFocus();
  });

  it("帮助文字通过 aria-describedby 关联", () => {
    render(
      <Field label="代号" help="两到十二个字符">
        <Input />
      </Field>,
    );
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "两到十二个字符",
    );
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("有 error 即为错误态：aria-invalid，错误说明排在帮助文字之前", () => {
    render(
      <Field label="代号" help="两到十二个字符" error="代号不能为空">
        <Input />
      </Field>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("代号不能为空 两到十二个字符");
  });

  it("required 交给控件，菱形记号对读屏隐藏", () => {
    const { container } = render(
      <Field label="代号" required>
        <Input />
      </Field>,
    );
    expect(screen.getByRole("textbox")).toBeRequired();
    expect(container.querySelector("[data-required]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    // 记号不进入可访问名称
    expect(screen.getByRole("textbox", { name: "代号" })).toBeInTheDocument();
  });

  it("disabled 交给控件", () => {
    render(
      <Field label="代号" disabled>
        <Input />
      </Field>,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("控件上显式传的值优先于字段", () => {
    render(
      <Field label="代号" disabled error="不对">
        <Input disabled={false} invalid={false} id="custom" />
      </Field>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toBeEnabled();
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute("id", "custom");
  });

  it("controlId 指定控件的 id", () => {
    render(
      <Field label="代号" controlId="codename">
        <Input />
      </Field>,
    );
    expect(screen.getByRole("textbox", { name: "代号" })).toHaveAttribute(
      "id",
      "codename",
    );
  });

  it("同样适用于多行文本", () => {
    render(
      <Field label="备注" error="备注过长">
        <Textarea />
      </Field>,
    );
    const textarea = screen.getByRole("textbox", { name: "备注" });
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription("备注过长");
  });

  it("group 渲染成 fieldset + legend，说明文字挂在组上", () => {
    render(
      <Field group label="通知方式" help="可以多选">
        <Checkbox>站内信</Checkbox>
        <Checkbox>邮件</Checkbox>
      </Field>,
    );
    const group = screen.getByRole("group", { name: "通知方式" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group).toHaveAccessibleDescription("可以多选");
    // 组里的控件各有各的 id，不会抢同一个
    const [first, second] = screen.getAllByRole("checkbox");
    expect(first).not.toHaveAttribute("id");
    expect(second).not.toHaveAttribute("id");
  });

  it("group 禁用时里面的控件一起禁用", () => {
    render(
      <Field group label="通知方式" disabled>
        <Checkbox>站内信</Checkbox>
        <RadioGroup defaultValue="a">
          <Radio value="a">甲</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("radio")).toBeDisabled();
  });
});
