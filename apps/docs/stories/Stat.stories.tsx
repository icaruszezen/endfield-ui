import { RollingNumber, Stat } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Stat 统计块",
  component: Stat,
  args: { label: "TOTAL", value: "1,280", unit: "件", delta: "+6%" },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    trend: { control: "inline-radio", options: ["up", "down"] },
  },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Trends: Story = {
  name: "增量",
  render: () => (
    <div className="flex flex-wrap gap-x-12 gap-y-8">
      <Stat label="OUTPUT" value="1,280" unit="件" delta="+6%" />
      <Stat label="RESERVE" value="342" unit="箱" delta="−2%" trend="down" />
      <Stat label="DEPTH" value="42.5" unit="m" />
    </div>
  ),
};

export const Emphasis: Story = {
  name: "并排时让一个更大",
  render: () => (
    <div className="flex flex-wrap items-end gap-x-12 gap-y-8">
      <Stat size="lg" label="采样点" value="128" unit="处" delta="+12" />
      <Stat label="已完成" value="96" unit="处" />
      <Stat label="待复核" value="7" unit="处" delta="−3" trend="down" />
    </div>
  ),
};

/* 数字要滚上来，就把一个 RollingNumber 放进 value；重播见"滚动数字"的"入场动画" */
export const Rolling: Story = {
  name: "数字滚上来",
  render: () => (
    <div className="flex flex-wrap items-end gap-x-12 gap-y-8">
      <Stat
        size="lg"
        label="采样点"
        value={<RollingNumber value={128} />}
        unit="处"
        delta="+12"
      />
      <Stat label="已完成" value={<RollingNumber value={96} />} unit="处" />
      <Stat label="深度" value={<RollingNumber value={42.5} />} unit="m" />
    </div>
  ),
};

export const Narrow: Story = {
  name: "窄容器里不溢出",
  render: () => (
    <div className="w-40 border border-dashed border-line-strong p-3">
      <Stat label="TOTAL OUTPUT" value="1,280,640" unit="件" delta="+6%" />
    </div>
  ),
};
