import { Skeleton } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Skeleton 骨架",
  component: Skeleton,
  argTypes: {
    variant: { control: "inline-radio", options: ["block", "text", "circle"] },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <Skeleton {...args} />
    </div>
  ),
};

export const Variants: Story = {
  name: "三种形状",
  render: () => (
    <div className="flex max-w-sm flex-col gap-6">
      <Skeleton className="h-32" />
      <Skeleton variant="text" />
      <Skeleton variant="circle" />
    </div>
  ),
};

export const Card: Story = {
  name: "与内容等大的占位",
  render: () => (
    <div aria-busy="true" className="flex max-w-sm flex-col gap-4">
      <Skeleton className="aspect-video h-auto" />
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" />
        <div className="flex-1 text-sm">
          <Skeleton variant="text" lines={2} />
        </div>
      </div>
    </div>
  ),
};

export const Pulse: Story = {
  name: "很轻的明度往返",
  render: () => (
    <div className="max-w-sm">
      <Skeleton variant="text" pulse />
    </div>
  ),
};
