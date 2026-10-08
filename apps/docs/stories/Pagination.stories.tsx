import { Pagination } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Pagination 分页条",
  component: Pagination,
  args: { pageCount: 12 },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    page: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸",
  render: () => (
    <div className="flex flex-col gap-6">
      <Pagination size="md" pageCount={12} defaultPage={3} />
      <Pagination size="lg" pageCount={12} defaultPage={3} />
    </div>
  ),
};

export const Ends: Story = {
  name: "首页 · 中间 · 末页",
  render: () => (
    <div className="flex flex-col gap-6">
      <Pagination pageCount={12} defaultPage={1} />
      <Pagination pageCount={12} defaultPage={6} />
      <Pagination pageCount={12} defaultPage={12} />
      <Pagination pageCount={1} />
    </div>
  ),
};

function Jumping() {
  const [page, setPage] = useState(7);
  return (
    <div className="flex flex-col gap-3">
      <Pagination pageCount={128} page={page} onPageChange={setPage} jump />
      <p className="text-sm text-ink-secondary">
        {`当前第 ${page} 页。在页码处输入数字，回车或点别处跳页，Esc 还原。`}
      </p>
    </div>
  );
}

export const Jump: Story = {
  name: "跳页",
  render: () => <Jumping />,
};

export const Narrow: Story = {
  name: "窄容器",
  render: () => (
    <div className="w-56">
      <Pagination pageCount={128} defaultPage={64} jump />
    </div>
  ),
};
