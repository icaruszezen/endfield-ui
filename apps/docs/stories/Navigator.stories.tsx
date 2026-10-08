import { DashIndicator, Navigator } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const zones = ["谷地", "第七勘探区", "荒原", "旧输料口"];

const meta = {
  title: "控件/Navigator 胶囊导航器",
  component: Navigator,
  args: { items: zones, "aria-label": "勘探区" },
  argTypes: {
    items: { control: false },
    index: { control: false },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Navigator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Navigator size="sm" items={zones} aria-label="勘探区" />
      <Navigator size="md" items={zones} aria-label="勘探区" />
    </div>
  ),
};

export const Loop: Story = {
  name: "首尾相接",
  args: { loop: true },
};

function Paired() {
  const [index, setIndex] = useState(1);
  return (
    <div className="flex flex-col items-center gap-4">
      <Navigator
        items={zones}
        index={index}
        onIndexChange={setIndex}
        loop
        aria-label="勘探区"
      />
      {/* 位置已经由导航器播报，短横只是给眼睛看的 */}
      <DashIndicator count={zones.length} index={index} aria-hidden="true" />
    </div>
  );
}

export const WithDashes: Story = {
  name: "配进度短横",
  render: () => (
    <div className="flex flex-col items-start gap-8">
      <Paired />
      {/* 压在深色版块上：给容器加 data-theme="dark"，控件自己不用换写法 */}
      <div data-theme="dark" className="bg-surface-sunken p-8">
        <Paired />
      </div>
    </div>
  ),
};

export const Narrow: Story = {
  name: "窄容器里截断",
  render: () => (
    <div className="w-56">
      <Navigator
        className="flex"
        items={["第七勘探区北段管廊的第二个采样点", "谷地"]}
        aria-label="采样点"
      />
    </div>
  ),
};
