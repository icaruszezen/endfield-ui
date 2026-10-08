import { Button, Progress, ProgressRing } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Progress 进度",
  component: Progress,
  args: { value: 64, "aria-label": "同步进度" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: { showValue: true } };

export const Sizes: Story = {
  name: "细与标准",
  render: () => (
    <div className="flex flex-col gap-6">
      <Progress size="sm" value={64} showValue aria-label="细条" />
      <Progress size="md" value={64} showValue aria-label="标准条" />
    </div>
  ),
};

export const Values: Story = {
  name: "从空到满",
  render: () => (
    <div className="flex flex-col gap-4">
      {[0, 8, 50, 92, 100].map((value) => (
        <Progress
          key={value}
          value={value}
          showValue
          aria-label={`进度 ${value}%`}
        />
      ))}
    </div>
  ),
};

export const Segmented: Story = {
  name: "分段进度",
  render: () => (
    <div className="flex flex-col gap-6">
      <Progress segments={6} value={3} showValue aria-label="步骤" />
      <Progress size="sm" segments={12} value={9} showValue aria-label="阶段" />
    </div>
  ),
};

export const Indeterminate: Story = {
  name: "不确定进度",
  render: () => (
    <div className="flex flex-col gap-6">
      <Progress aria-label="正在连接" />
      <Progress size="sm" aria-label="正在连接" />
    </div>
  ),
};

export const CustomValue: Story = {
  name: "自定义数值",
  render: () => (
    <Progress
      value={96}
      max={128}
      showValue
      formatValue={(value, max) => `${value} / ${max}`}
      aria-label="采样点"
    />
  ),
};

export const Ring: Story = {
  name: "进度环",
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6">
        {[0, 25, 64, 100].map((value) => (
          <ProgressRing
            key={value}
            value={value}
            showValue
            aria-label={`进度 ${value}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <ProgressRing size={24} value={64} aria-label="小号" />
        <ProgressRing size={32} value={64} aria-label="中号" />
        <ProgressRing size={72} value={64} showValue aria-label="大号" />
        <ProgressRing size={96} value={64} showValue aria-label="特大号" />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        {/* 围住一个头像或图标 */}
        <ProgressRing size={56} value={72} aria-label="甲组的进度">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-sm font-bold">
            甲
          </span>
        </ProgressRing>
        <ProgressRing aria-label="正在连接" />
        <ProgressRing size={24} aria-label="正在连接" />
      </div>
    </div>
  ),
};

function Replay() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-start gap-4">
      <Progress
        key={run}
        className="w-full"
        value={72}
        animate
        showValue
        aria-label="同步进度"
      />
      <Button variant="light" size="sm" onClick={() => setRun(run + 1)}>
        重播
      </Button>
    </div>
  );
}

export const Entrance: Story = {
  name: "入场充填",
  render: () => <Replay />,
};
