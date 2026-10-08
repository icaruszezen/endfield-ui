import { GhostText, SectionTitle } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "母题/GhostText 镂空巨字",
  component: GhostText,
  args: { children: "//Archive", variant: "hatch" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["hatch", "outline", "solid"],
    },
  },
  decorators: [
    (Story) => (
      // 巨字允许被截断，但必须裁在自己的容器里，不能撑出横向滚动条
      <div className="overflow-clip">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GhostText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: "三种画法",
  render: () => (
    <div className="flex flex-col gap-2">
      <GhostText className="text-6xl">//Archive</GhostText>
      <GhostText variant="outline" className="text-6xl">
        Section 03
      </GhostText>
      <GhostText variant="solid" className="text-6xl">
        //Record
      </GhostText>
    </div>
  ),
};

export const BehindSection: Story = {
  name: "垫在版块后面",
  render: () => (
    // 巨字放在版块的空白处（这里是右下），不从标题和正文后面穿过
    <section className="relative min-h-72 overflow-clip px-2 py-6">
      <GhostText className="absolute -right-6 -bottom-5">//Archive</GhostText>
      <div className="relative">
        <SectionTitle latin="Archive" animate={false}>
          档案
        </SectionTitle>
        <p className="mt-4 max-w-prose text-ink-secondary">
          巨字是背景，不是标题：对比度明显低于真正的标题，越过容器边界时直接被截断。
        </p>
      </div>
    </section>
  ),
};
