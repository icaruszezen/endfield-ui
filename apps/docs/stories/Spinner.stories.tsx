import { List, ListRow, ProgressRing, Spinner } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Spinner 行内加载指示",
  component: Spinner,
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸",
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner size="sm" />
      <Spinner size="md" />
    </div>
  ),
};

export const Inline: Story = {
  name: "跟在文字旁",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {/* 旁边已经写了"正在同步"，方块只是装饰 */}
      <p className="flex items-center gap-2 text-sm text-ink-secondary">
        <Spinner size="sm" label={null} />
        正在同步
      </p>
      <p className="flex items-center gap-2 text-accent-ink">
        <Spinner label={null} />
        颜色继承文字
      </p>
    </div>
  ),
};

export const InRows: Story = {
  name: "列表行尾",
  render: () => (
    <List className="max-w-sm">
      <ListRow end="已完成">基础资料</ListRow>
      <ListRow end={<Spinner size="sm" label="正在上传" />}>附件</ListRow>
      <ListRow end="等待中">审核</ListRow>
    </List>
  ),
};

export const Ring: Story = {
  name: "圆环形的",
  render: () => (
    <p className="flex items-center gap-2 text-sm text-ink-secondary">
      <ProgressRing size={16} aria-label="加载中" />
      圆环形的行内加载用 16px 的进度环
    </p>
  ),
};
