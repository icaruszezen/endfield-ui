import { Button, Kbd, List, ListRow } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Kbd 键位提示",
  component: Kbd,
  args: { children: "F" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸与宽键",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-2">
        <Kbd>F</Kbd>
        <Kbd>Esc</Kbd>
        <Kbd>Ctrl</Kbd>
        <Kbd>Space</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <Kbd size="md">F</Kbd>
        <Kbd size="md">Esc</Kbd>
        <Kbd size="md">Ctrl</Kbd>
        <Kbd size="md">Space</Kbd>
      </div>
    </div>
  ),
};

export const Combination: Story = {
  name: "组合键",
  render: () => (
    <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
      <Kbd>Ctrl</Kbd>
      <span aria-hidden="true">+</span>
      <Kbd>K</Kbd>
      <span className="ml-1.5">打开搜索</span>
    </p>
  ),
};

export const BesideControls: Story = {
  name: "贴在控件旁",
  render: () => (
    <div className="flex max-w-sm flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button>确认</Button>
        <Kbd size="md">F</Kbd>
      </div>
      <List>
        <ListRow end={<Kbd>M</Kbd>}>打开地图</ListRow>
        <ListRow end={<Kbd>B</Kbd>}>打开仓库</ListRow>
        <ListRow end={<Kbd>Esc</Kbd>}>返回上一级</ListRow>
      </List>
    </div>
  ),
};
