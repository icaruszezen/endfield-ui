import { Field, Stepper } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Stepper 步进器",
  component: Stepper,
  args: { "aria-label": "数量", defaultValue: 3, min: 0, max: 99 },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    value: { control: false },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Stepper size="sm" aria-label="小" defaultValue={3} />
      <Stepper size="md" aria-label="中" defaultValue={3} />
      <Stepper size="lg" aria-label="大" defaultValue={3} />
    </div>
  ),
};

export const Limits: Story = {
  name: "上下限",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Stepper aria-label="已在下限" defaultValue={1} min={1} max={8} />
      <Stepper aria-label="中间" defaultValue={4} min={1} max={8} />
      <Stepper aria-label="已在上限" defaultValue={8} min={1} max={8} />
    </div>
  ),
};

export const Decimal: Story = {
  name: "小数步长",
  render: () => (
    <Field label="浓度" help="每一步 0.1，范围 0 – 2。">
      <Stepper defaultValue={0.3} step={0.1} min={0} max={2} />
    </Field>
  ),
};

function Order() {
  const stock = 64;
  const [count, setCount] = useState(72);
  return (
    <div className="flex max-w-xs flex-col gap-6">
      <Field
        label="领取数量"
        required
        help={`库存 ${stock} 件。可以直接输入，也可以按住两端的按钮。`}
        error={
          count > stock ? `数量不能超过库存 ${stock} 件。` : undefined
        }
      >
        <Stepper value={count} onValueChange={setCount} min={1} max={999} />
      </Field>
      <Field label="禁用" disabled>
        <Stepper defaultValue={12} />
      </Field>
      <Field label="只读">
        <Stepper defaultValue={12} readOnly />
      </Field>
    </div>
  );
}

export const InField: Story = {
  name: "放进字段",
  render: () => <Order />,
};

export const Stretched: Story = {
  name: "撑满宽度",
  render: () => (
    <div className="w-64">
      <Stepper aria-label="数量" defaultValue={128} className="flex w-full" />
    </div>
  ),
};
