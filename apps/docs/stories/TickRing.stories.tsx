import { TickRing } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IsoCube } from "./_shared/IsoCube";

const meta = {
  title: "母题/TickRing 刻度圆环",
  component: TickRing,
  args: { size: 240, ticks: 40, spin: false },
  argTypes: {
    size: { control: { type: "range", min: 96, max: 360, step: 8 } },
    ticks: { control: { type: "range", min: 12, max: 72, step: 4 } },
  },
} satisfies Meta<typeof TickRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <TickRing {...args}>
      <IsoCube size={96} />
    </TickRing>
  ),
};

export const AroundSubject: Story = {
  name: "围住一个主体",
  render: () => (
    <div className="flex flex-wrap items-center gap-10">
      <TickRing size={200}>
        <IsoCube size={80} />
      </TickRing>
      <TickRing size={128} ticks={24}>
        <span className="font-tech text-2xl font-bold">03</span>
      </TickRing>
    </div>
  ),
};

export const Spinning: Story = {
  name: "缓慢旋转",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <TickRing size={200} spin>
        <IsoCube size={80} />
      </TickRing>
      <p className="max-w-prose text-sm text-ink-secondary">
        60 秒一圈。系统开启"减少动态效果"时圆环静止。
      </p>
    </div>
  ),
};

export const Fluid: Story = {
  name: "跟着容器走",
  render: () => (
    <div className="w-1/2 max-w-xs">
      <TickRing size="100%" />
    </div>
  ),
};
