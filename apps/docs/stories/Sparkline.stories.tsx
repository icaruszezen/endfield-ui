import { Sparkline, Stat } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const rising = [42, 58, 51, 77, 69, 88, 80, 96];
const falling = [64, 60, 71, 55, 62, 48, 57, 44];

const meta = {
  title: "控件/Sparkline 小型面积图",
  component: Sparkline,
  args: { data: rising, variant: "area", tone: "info" },
  argTypes: {
    variant: { control: "inline-radio", options: ["area", "line"] },
    tone: {
      control: "inline-radio",
      options: ["info", "danger", "accent", "neutral"],
    },
    data: { control: "object" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: "两种形状、四种颜色",
  render: () => (
    <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-6 gap-y-3 text-sm text-ink-secondary">
      <span />
      <span>area</span>
      <span>line</span>
      {(["info", "danger", "accent", "neutral"] as const).map((tone) => (
        <div key={tone} className="contents">
          <span className="font-tech">{tone}</span>
          <Sparkline data={rising} tone={tone} />
          <Sparkline data={falling} tone={tone} variant="line" />
        </div>
      ))}
    </div>
  ),
};

export const Range: Story = {
  name: "纵向范围",
  render: () => (
    <div className="flex flex-col gap-4 text-sm text-ink-secondary">
      <div>
        <p className="mb-1">默认：最低的一点下面留四分之一</p>
        <Sparkline data={rising} />
      </div>
      <div>
        <p className="mb-1">min=0：从零画起，起伏看着小了</p>
        <Sparkline data={rising} min={0} />
      </div>
      <div>
        <p className="mb-1">max=200：给以后的增长留出位置</p>
        <Sparkline data={rising} min={0} max={200} />
      </div>
    </div>
  ),
};

export const BesideStat: Story = {
  name: "放在统计块旁边",
  decorators: [],
  render: () => (
    <div className="flex items-end gap-4">
      <Stat label="OUTPUT" value="1,280" unit="件" delta="+6%" />
      {/* 旁边的数字才是内容，图只是帮着看趋势；尺寸由外面的盒子给 */}
      <div className="h-12 w-32">
        <Sparkline data={rising} className="h-full" />
      </div>
    </div>
  ),
};

export const Labelled: Story = {
  name: "独自承担含义时给它一个名称",
  args: { label: "近八天的产出：先升后稳，总体上升", variant: "line" },
};
