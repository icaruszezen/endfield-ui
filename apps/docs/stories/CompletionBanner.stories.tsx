import { Button, CompletionBanner, List, ListRow } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/CompletionBanner 完成横幅",
  component: CompletionBanner,
  args: {
    title: "第三阶段已完成",
    description: "共 6 项，用时 3 天",
    word: "COMPLETED",
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompletionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAction: Story = {
  name: "带一个行动",
  args: { action: <Button>领取奖励</Button> },
};

export const TitleOnly: Story = {
  name: "只有标题",
  args: { description: undefined, word: null },
};

export const AboveList: Story = {
  name: "一个阶段全部完成",
  render: () => (
    <div>
      <CompletionBanner
        title="例行检修已完成"
        description="3 项全部通过"
        action={<Button size="sm">查看报告</Button>}
      />
      <List>
        <ListRow completed end="2026.10.05">
          校准传感器
        </ListRow>
        <ListRow completed end="2026.10.06">
          更换滤芯
        </ListRow>
        <ListRow completed end="2026.10.07">
          复核采样记录
        </ListRow>
      </List>
    </div>
  ),
};

export const Narrow: Story = {
  name: "窄容器",
  render: () => (
    <div className="w-60">
      <CompletionBanner
        title="例行检修已完成"
        description="3 项全部通过"
        action={<Button size="sm">查看报告</Button>}
      />
    </div>
  ),
};
