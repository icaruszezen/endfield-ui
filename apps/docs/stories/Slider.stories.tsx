import { Field, Slider, type SliderSingleProps } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentType } from "react";

const meta = {
  title: "控件/Slider 滑块",
  // 属性是单个值、范围两支的联合；控件面板按单个值那一支来
  component: Slider as ComponentType<SliderSingleProps>,
  args: {
    "aria-label": "音量",
    defaultValue: 40,
    min: 0,
    max: 100,
    step: 1,
    size: "md",
    showValue: true,
    disabled: false,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    value: { control: false },
    marks: { control: false },
    format: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<SliderSingleProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InField: Story = {
  name: "放进字段",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [scale, setScale] = useState(1);
    return (
      <Field label="界面缩放" help="只影响这台设备。拖的时候下面的字跟着变。">
        <Slider
          value={scale}
          onValueChange={setScale}
          min={0.8}
          max={1.4}
          step={0.05}
          showValue
          format={{ style: "percent" }}
        />
        <p
          className="mt-2 border-l-4 border-ink pl-3 text-ink-secondary"
          style={{ fontSize: `${scale}rem` }}
        >
          北区七号站 · 到站 12 批
        </p>
      </Field>
    );
  },
};

export const Range: Story = {
  name: "范围",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [range, setRange] = useState<[number, number]>([20, 60]);
    return (
      <Field
        label="载重（吨）"
        help={`只看 ${range[0]} 到 ${range[1]} 吨之间的批次。两个滑块至少隔 5 吨。`}
      >
        <Slider
          value={range}
          onValueChange={setRange}
          max={120}
          step={5}
          minStepsBetweenValues={1}
          showValue
        />
      </Field>
    );
  },
};

export const Marks: Story = {
  name: "刻度",
  args: {
    "aria-label": "巡检间隔",
    defaultValue: 30,
    max: 60,
    step: 15,
    showValue: false,
    marks: [
      { value: 0, label: "关" },
      { value: 15, label: "15 分" },
      { value: 30, label: "30 分" },
      { value: 45, label: "45 分" },
      { value: 60, label: "1 时" },
    ],
  },
};

export const States: Story = {
  name: "尺寸与禁用",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      <Slider aria-label="紧凑" size="sm" defaultValue={30} showValue />
      <Slider aria-label="默认" defaultValue={60} showValue />
      <Slider aria-label="禁用" defaultValue={45} showValue disabled />
      <Slider
        aria-label="禁用的范围"
        defaultValue={[20, 70]}
        showValue
        disabled
      />
    </div>
  ),
};

/* 整体切到菱形方案：滑块换成一个菱形 */
export const Diamond: Story = {
  name: "菱形方案",
  parameters: { controls: { disable: true } },
  render: () => (
    <div data-choice="diamond" className="flex flex-col gap-4">
      <Slider aria-label="音量" defaultValue={40} showValue />
      <Slider aria-label="范围" defaultValue={[25, 75]} showValue />
    </div>
  ),
};
