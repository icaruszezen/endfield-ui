import { Button, Hatch } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "母题/Hatch 斜纹",
  component: Hatch,
  args: { density: "bold", className: "h-12 max-w-md bg-surface-muted" },
  argTypes: {
    density: { control: "inline-radio", options: ["bold", "mid", "fine"] },
  },
} satisfies Meta<typeof Hatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Densities: Story = {
  name: "三档",
  render: () => (
    <div className="grid max-w-md gap-4">
      <div>
        <Hatch className="h-12 bg-surface-muted" />
        <p className="mt-1 text-xs text-ink-secondary">
          bold：条带状的表面，跟随主题
        </p>
      </div>
      <div>
        {/* 中档是给深色控件配的，底色也不随主题变 */}
        <Hatch density="mid" className="h-12 bg-control" />
        <p className="mt-1 text-xs text-ink-secondary">
          mid：压在深色控件上，两个主题下相同
        </p>
      </div>
      <div>
        <Hatch density="fine" className="h-12 border border-line" />
        <p className="mt-1 text-xs text-ink-secondary">
          fine：填未探索的区域、留空的格子
        </p>
      </div>
    </div>
  ),
};

export const ToolbarStrip: Story = {
  name: "垫在工具条下面",
  render: () => (
    <div className="relative flex max-w-md items-center justify-between bg-surface-muted px-3 py-2">
      <Hatch className="absolute inset-0" />
      <span className="relative text-sm font-medium">已选 3 项</span>
      <Button size="sm" className="relative">
        批量处理
      </Button>
    </div>
  ),
};
