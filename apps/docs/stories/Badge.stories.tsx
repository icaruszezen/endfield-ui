import { Badge, Button, IconButton, Plus } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Badge 角标",
  component: Badge,
  args: { count: 12 },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Standalone: Story = {
  name: "单独使用",
  render: () => (
    <div className="flex items-center gap-6">
      <Badge count={3} />
      <Badge count={12} />
      <Badge count={120} />
      <Badge count={12} max={9} />
      <Badge dot label="有新消息" />
    </div>
  ),
};

export const Attached: Story = {
  name: "压在元素右上角",
  render: () => (
    <div className="flex items-center gap-10">
      <Badge count={5} label="5 条未读">
        <IconButton aria-label="消息">
          <Plus />
        </IconButton>
      </Badge>
      <Badge dot label="有待处理的任务">
        <IconButton aria-label="任务">
          <Plus />
        </IconButton>
      </Badge>
      <Badge count={128} label="128 条待处理">
        <Button variant="light">待办</Button>
      </Badge>
      <Badge count={0}>
        <Button variant="light">数量为 0 时不显示</Button>
      </Badge>
    </div>
  ),
};
