import { Field, Input, Textarea } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Input 输入框",
  component: Input,
  args: { placeholder: "例如 SEVENTH", "aria-label": "代号" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸",
  render: () => (
    <div className="flex flex-col gap-4">
      <Input size="sm" aria-label="小" placeholder="sm · 32px" />
      <Input size="md" aria-label="中" placeholder="md · 40px" />
      <Input size="lg" aria-label="大" placeholder="lg · 56px" />
    </div>
  ),
};

export const States: Story = {
  name: "状态",
  render: () => (
    <div className="flex flex-col gap-6">
      <Field label="默认" help="悬停时底边线深一档，聚焦时变墨色并出现焦点环。">
        <Input placeholder="例如 SEVENTH" />
      </Field>
      <Field label="已填写">
        <Input defaultValue="SEVENTH" />
      </Field>
      <Field label="错误" error="代号只能包含字母，去掉数字后再试。">
        <Input defaultValue="SEVENTH-7" />
      </Field>
      <Field label="禁用" disabled help="归档后不能修改。">
        <Input defaultValue="SEVENTH" />
      </Field>
      <Field label="只读">
        <Input readOnly defaultValue="SEVENTH" />
      </Field>
    </div>
  ),
};

export const Adornments: Story = {
  name: "前后缀",
  render: () => (
    <div className="flex flex-col gap-6">
      <Field label="采样深度">
        <Input inputMode="decimal" defaultValue="42.5" end="m" />
      </Field>
      <Field label="编号">
        <Input
          defaultValue="0128"
          start={<span className="font-tech text-sm">#</span>}
        />
      </Field>
      <Field label="数量" error="数量不能超过库存 64 件。">
        <Input inputMode="numeric" defaultValue="128" end="件" />
      </Field>
    </div>
  ),
};

export const Outline: Story = {
  name: "四边描边",
  render: () => (
    <div className="flex flex-col gap-6">
      {/* 凹陷底色的区域里，默认的凹陷输入框会融进去，这时换成描边 */}
      <div className="flex flex-wrap items-end gap-4 bg-surface-sunken p-4">
        <Field label="检索" className="min-w-40 flex-1">
          <Input variant="outline" placeholder="代号或编号" />
        </Field>
        <Field label="深度不超过" className="w-32">
          <Input variant="outline" inputMode="decimal" end="m" />
        </Field>
      </div>
      <div className="flex flex-col gap-6 bg-surface-sunken p-4">
        <Field label="错误" error="代号只能包含字母，去掉数字后再试。">
          <Input variant="outline" defaultValue="SEVENTH-7" />
        </Field>
        <Field label="禁用" disabled>
          <Input variant="outline" defaultValue="SEVENTH" />
        </Field>
        <Field label="只读">
          <Input variant="outline" readOnly defaultValue="SEVENTH" />
        </Field>
        <Field label="备注">
          <Textarea variant="outline" showCount maxLength={200} />
        </Field>
      </div>
    </div>
  ),
};

export const Multiline: Story = {
  name: "多行文本",
  render: () => (
    <div className="flex flex-col gap-6">
      <Field label="备注" help="写给下一班的人看。">
        <Textarea
          showCount
          maxLength={200}
          defaultValue="北段管廊的第二个采样点有渗水，取样前先确认排水泵已经开启。"
        />
      </Field>
      <Field label="备注" error="备注不能为空。">
        <Textarea placeholder="最少三行高，可以向下拖大" />
      </Field>
      <Field label="备注" disabled>
        <Textarea showCount defaultValue="已归档，不能修改。" />
      </Field>
    </div>
  ),
};
