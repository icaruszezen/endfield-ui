import { RecIndicator } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScenePlaceholder } from "./_shared/Placeholders";

const meta = {
  title: "控件/RecIndicator 录制指示",
  component: RecIndicator,
  args: { label: "REC", blink: true },
} satisfies Meta<typeof RecIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Labels: Story = {
  name: "几种进行中",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <RecIndicator />
      <RecIndicator label="LIVE" />
      <RecIndicator blink={false} />
    </div>
  ),
};

export const OnMedia: Story = {
  name: "压在画面角上",
  render: () => (
    // 画面是深色的：给容器加 data-theme="dark"，文字与括号跟着换
    <div data-theme="dark" className="relative max-w-sm">
      <ScenePlaceholder tone="dark" className="block aspect-video w-full" />
      <RecIndicator className="absolute top-3 left-3" />
    </div>
  ),
};
