import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { stubAnimations } from "../../test/animations";
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

  it("错误说明：一上来就带着的是静止的，后来才出现的才从 0 长出来", () => {
    const start = ["starting:grid-rows-[0fr]", "starting:opacity-0"];
    const wrapper = (text: string) =>
      screen.getByText(text).closest("p")!.parentElement!.parentElement!;

    const { container, rerender } = render(
      <Field label="代号" error="代号不能为空">
        <Input />
      </Field>,
    );
    expect(wrapper("代号不能为空")).toHaveClass("grid", "grid-rows-[1fr]");
    expect(wrapper("代号不能为空")).not.toHaveClass(...start);

    rerender(
      <Field label="代号">
        <Input />
      </Field>,
    );
    // 没有动效可等的环境里撤掉就不在了，也不留占位
    expect(screen.queryByText("代号不能为空")).not.toBeInTheDocument();
    expect(container.firstElementChild!.children).toHaveLength(2);

    rerender(
      <Field label="代号" error="代号太长">
        <Input />
      </Field>,
    );
    expect(wrapper("代号太长")).toHaveClass(...start);
    // 整句话从第一帧就在：读屏照常读到
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("代号太长");
  });

  it("错误说明撤掉：关联和错误态当场断开，那一句留着收完、对读屏隐藏，收完才不在", async () => {
    const finish = stubAnimations();
    const { rerender } = render(
      <Field label="代号" help="两到十二个字符" error="代号不能为空">
        <Input />
      </Field>,
    );
    const input = screen.getByRole("textbox");
    const sentence = screen.getByText("代号不能为空");
    const wrapper = sentence.closest("p")!.parentElement!.parentElement!;
    expect(wrapper).not.toHaveAttribute("aria-hidden");

    rerender(
      <Field label="代号" help="两到十二个字符">
        <Input />
      </Field>,
    );
    // 状态不等动效
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription("两到十二个字符");
    expect(input.closest("[data-invalid]")).toBeNull();
    // 画的还是最后那一句，正在收
    expect(sentence).toBeInTheDocument();
    expect(sentence).toHaveTextContent("代号不能为空");
    expect(wrapper).toHaveAttribute("data-leaving");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");

    await finish();
    expect(screen.queryByText("代号不能为空")).not.toBeInTheDocument();
  });

  it("错误说明收到一半又出错：换成新的那一句，不卸载", async () => {
    const finish = stubAnimations();
    const { rerender } = render(
      <Field label="代号" error="代号不能为空">
        <Input />
      </Field>,
    );
    rerender(
      <Field label="代号">
        <Input />
      </Field>,
    );
    rerender(
      <Field label="代号" error="代号太长">
        <Input />
      </Field>,
    );
    const wrapper = screen.getByText("代号太长").closest("p")!.parentElement!
      .parentElement!;
    expect(wrapper).not.toHaveAttribute("data-leaving");
    expect(wrapper).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("代号太长");

    await finish();
    expect(screen.getByText("代号太长")).toBeInTheDocument();
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

  it("group 的错误说明同样先收起再卸载", async () => {
    const finish = stubAnimations();
    const { rerender } = render(
      <Field group label="通知方式" error="至少选一种">
        <Checkbox>站内信</Checkbox>
      </Field>,
    );
    const group = screen.getByRole("group", { name: "通知方式" });
    expect(group).toHaveAccessibleDescription("至少选一种");

    rerender(
      <Field group label="通知方式">
        <Checkbox>站内信</Checkbox>
      </Field>,
    );
    expect(group).not.toHaveAttribute("aria-describedby");
    expect(group).not.toHaveAttribute("data-invalid");
    expect(screen.getByText("至少选一种")).toBeInTheDocument();

    await finish();
    expect(screen.queryByText("至少选一种")).not.toBeInTheDocument();
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
