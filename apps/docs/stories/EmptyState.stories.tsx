import { Button, EmptyState } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/EmptyState 空状态",
  component: EmptyState,
  args: {
    title: "暂无记录",
    description: "完成一次测绘后，这里会出现记录。",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAction: Story = {
  name: "带一个行动",
  args: { action: <Button>新建测绘任务</Button> },
};

export const Cases: Story = {
  name: "不同的空，文案分开写",
  render: () => (
    <div className="@container">
      <div className="grid gap-6 @2xl:grid-cols-2">
        <EmptyState
          title="没有匹配的记录"
          description="换一个关键词，或者清除筛选条件再试。"
          action={<Button variant="light">清除筛选</Button>}
        />
        <EmptyState
          title="无法读取档案"
          description="网络连接已断开。恢复后会自动重试。"
          action={<Button>立即重试</Button>}
        />
      </div>
    </div>
  ),
};

export const Borderless: Story = {
  name: "无边框、无图形",
  args: { bordered: false, icon: null },
};
