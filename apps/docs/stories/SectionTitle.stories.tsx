import { Button, SectionTitle } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { IsoCube } from "./_shared/IsoCube";

const meta = {
  title: "控件/SectionTitle 分节标题",
  component: SectionTitle,
  args: { children: "勘探日志", latin: "Field Log" },
  argTypes: {
    variant: {
      control: "select",
      options: ["standard", "plain", "band", "side"],
    },
    illustration: { control: false },
  },
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Standard: Story = {
  name: "standard 标准",
  render: () => (
    <div className="flex flex-col gap-10">
      <SectionTitle latin="Field Log" meta="// 第七勘探队　2026.10.08">
        勘探日志
      </SectionTitle>
      <SectionTitle latin="Equipment" animate={false}>
        装备清单
      </SectionTitle>
    </div>
  ),
};

export const Entrance: Story = {
  name: "入场动画",
  render: function EntranceStory() {
    const [run, setRun] = useState(0);
    return (
      <div className="flex flex-col items-start gap-6">
        <SectionTitle key={run} latin="Field Log">
          勘探日志
        </SectionTitle>
        <Button size="sm" onClick={() => setRun((value) => value + 1)}>
          重播
        </Button>
        <p className="text-sm text-ink-secondary">
          滑块滑入 → 箭头转正 → 文字淡入，进入视口时只播一次。
        </p>
      </div>
    );
  },
};

export const Plain: Story = {
  name: "plain 简化",
  args: { variant: "plain", children: "显示设置" },
};

export const Band: Story = {
  name: "band 色带",
  render: () => (
    <SectionTitle
      variant="band"
      subtitle="Survey Division"
      illustration={<IsoCube />}
    >
      Archive
    </SectionTitle>
  ),
};

export const Narrow: Story = {
  name: "窄容器里不溢出",
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {[180, 280, 420].map((width) => (
        <div
          key={width}
          style={{ width }}
          className="flex flex-col gap-6 outline-1 outline-line outline-dashed"
        >
          <p className="font-tech text-xs text-ink-tertiary">{`// ${width}px`}</p>
          <SectionTitle
            variant="band"
            subtitle="Survey Division"
            illustration={<IsoCube size={56} />}
          >
            Wetland Archive
          </SectionTitle>
          <SectionTitle latin="Infrastructure" animate={false}>
            基础设施与补给线路
          </SectionTitle>
          <SectionTitle variant="plain">Configuration 显示设置</SectionTitle>
        </div>
      ))}
    </div>
  ),
};

export const Side: Story = {
  name: "side 竖排侧签",
  render: () => (
    <div className="flex flex-col gap-6">
      {(["accent", "muted"] as const).map((tone) => (
        <div key={tone} className="flex flex-col md:h-64 md:flex-row">
          <SectionTitle variant="side" tone={tone} latin="Gallery">
            影像资料
          </SectionTitle>
          <div className="flex flex-1 items-center justify-center border border-line bg-surface-raised p-6 text-sm text-ink-secondary">
            横向展开的内容区
          </div>
        </div>
      ))}
    </div>
  ),
};
