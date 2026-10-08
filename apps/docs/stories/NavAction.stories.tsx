import { NavAction } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RouterLink } from "./_shared/RouterLink";

const meta = {
  title: "控件/NavAction 主行动块",
  component: NavAction,
  args: { children: "前往控制台", layout: "inline" },
  argTypes: {
    layout: {
      control: "inline-radio",
      options: ["inline", "block", "stacked"],
    },
    icon: { control: false },
    render: { control: false },
  },
} satisfies Meta<typeof NavAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* 放进侧轨、顶栏、全屏菜单时摆法由它们定；这里手动指定，三种放在一起看 */
export const Layouts: Story = {
  name: "三种摆法",
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <figure>
        <NavAction layout="inline">前往控制台</NavAction>
        <figcaption className="mt-2 text-xs text-ink-secondary">
          inline：顶栏
        </figcaption>
      </figure>
      <figure className="w-56">
        <NavAction layout="block">前往控制台</NavAction>
        <figcaption className="mt-2 text-xs text-ink-secondary">
          block：展开的侧轨、全屏菜单的底部
        </figcaption>
      </figure>
      <figure>
        <NavAction layout="stacked">控制台</NavAction>
        <figcaption className="mt-2 text-xs text-ink-secondary">
          stacked：收起的侧轨
        </figcaption>
      </figure>
    </div>
  ),
};

export const Elements: Story = {
  name: "按钮、链接与禁用",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <NavAction onClick={() => {}}>按钮</NavAction>
      <NavAction href="#console">链接</NavAction>
      <NavAction render={<RouterLink to="/console" />}>路由链接</NavAction>
      <NavAction disabled>未开放</NavAction>
    </div>
  ),
};
