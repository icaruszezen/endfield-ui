import {
  BracketTitle,
  Button,
  RegistrationStrip,
  Tag,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/BracketTitle 方括号标题",
  component: BracketTitle,
  args: { children: "北区仓储站", level: 3 },
  argTypes: {
    level: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
  },
} satisfies Meta<typeof BracketTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "字号",
  render: () => (
    <div className="flex flex-col gap-4">
      <BracketTitle>默认 4xl</BracketTitle>
      <BracketTitle className="text-3xl">色带标题 3xl</BracketTitle>
      <BracketTitle className="text-2xl">分节标题 2xl</BracketTitle>
      <BracketTitle className="text-lg">行内 lg</BracketTitle>
    </div>
  ),
};

export const Entrance: Story = {
  name: "入场动画",
  render: function EntranceStory(args) {
    const [run, setRun] = useState(0);
    return (
      <div className="flex flex-col items-start gap-6">
        <BracketTitle key={run} {...args} />
        <Button size="sm" onClick={() => setRun((value) => value + 1)}>
          重播
        </Button>
        <p className="text-sm text-ink-secondary">
          括号先淡入 → 名称随后，进入视口时只播一次。
        </p>
      </div>
    );
  },
};

export const WithCompanions: Story = {
  name: "名称下的伴饰",
  render: () => (
    <div className="max-w-md">
      <BracketTitle level={2}>岑砚</BracketTitle>
      <div className="mt-3 flex items-center gap-3">
        <Tag>CEN YAN</Tag>
        <RegistrationStrip />
      </div>
      <p className="mt-4 text-sm text-ink-secondary">
        只用于人物、地点、物品的名称——"一个被归档的条目"。普通的分节标题用分节标题。
      </p>
    </div>
  ),
};

export const Narrow: Story = {
  name: "窄容器里不溢出",
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <BracketTitle className="text-3xl">第七勘探区临时补给站</BracketTitle>
      <BracketTitle className="mt-4 text-2xl">Northgate Depot</BracketTitle>
    </div>
  ),
};
