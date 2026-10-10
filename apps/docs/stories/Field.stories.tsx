import {
  Checkbox,
  Field,
  Input,
  Radio,
  RadioGroup,
  Textarea,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Field 表单字段",
  component: Field,
  args: {
    label: "代号",
    help: "两到十二个字母。",
    children: <Input placeholder="例如 SEVENTH" />,
  },
  argTypes: { children: { control: false } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Required: Story = {
  name: "必填与错误",
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-secondary">
        带
        <span
          aria-hidden="true"
          className="mx-1.5 inline-block size-1.5 rotate-45 bg-accent-ink align-middle"
        />
        的是必填项。
      </p>
      <Field label="代号" required help="两到十二个字母。">
        <Input placeholder="例如 SEVENTH" />
      </Field>
      <Field
        label="联络频段"
        required
        help="三位数字。"
        error="频段不能为空，请填写三位数字。"
      >
        <Input inputMode="numeric" />
      </Field>
      <Field label="备注">
        <Textarea />
      </Field>
    </div>
  ),
};

export const Groups: Story = {
  name: "一组控件",
  render: () => (
    <div className="flex flex-col gap-6">
      <Field group label="通知方式" help="可以多选。">
        <Checkbox defaultChecked>站内信</Checkbox>
        <Checkbox>邮件</Checkbox>
        <Checkbox>终端弹窗</Checkbox>
      </Field>
      <Field group label="测绘精度" required error="请选择一种精度。">
        <RadioGroup>
          <Radio value="draft">草图</Radio>
          <Radio value="standard">标准</Radio>
          <Radio value="fine">精细</Radio>
        </RadioGroup>
      </Field>
      <Field group label="归档范围" disabled help="归档后不能修改。">
        <RadioGroup defaultValue="all" orientation="horizontal">
          <Radio value="all">全部</Radio>
          <Radio value="mine">仅本班</Radio>
        </RadioGroup>
      </Field>
    </div>
  ),
};

/* 边打字边校验：错误说明是长出来、收回去的，下面的字段跟着走，不被顶一下 */
function LiveValidation() {
  const [value, setValue] = useState("");
  const wrong = value !== "" && !/^\d{3}$/.test(value);

  return (
    <div className="flex flex-col gap-6">
      <Field
        label="联络频段"
        required
        help="三位数字。"
        error={wrong ? "频段是三位数字，例如 204。" : undefined}
      >
        <Input
          inputMode="numeric"
          placeholder="204"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <Field
        label="备注"
        help="上面的错误说明出现、撤掉时，这一个字段是被推着走的。"
      >
        <Textarea />
      </Field>
    </div>
  );
}

export const ErrorMotion: Story = {
  name: "错误说明的出现与消失",
  render: () => <LiveValidation />,
};
