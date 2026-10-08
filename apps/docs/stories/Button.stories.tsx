import { ArrowRight, Button, ButtonGroup, Plus } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { RouterLink } from "./_shared/RouterLink";

const meta = {
  title: "控件/Button 按钮",
  component: Button,
  args: { children: "更多情报" },
  argTypes: {
    variant: {
      control: "select",
      options: ["control", "action", "light", "back", "text", "danger"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: "变体",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="action">前往终端</Button>
      <Button variant="control">更多情报</Button>
      <Button variant="light">取消</Button>
      <Button variant="back">返回</Button>
      <Button variant="danger">删除记录</Button>
      <Button variant="text">查看全部</Button>
    </div>
  ),
};

export const Sizes: Story = {
  name: "尺寸",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["control", "action", "light", "back"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-end gap-4">
          <Button variant={variant} size="sm">
            小号
          </Button>
          <Button variant={variant} size="md">
            默认尺寸
          </Button>
          <Button variant={variant} size="lg">
            首屏行动
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-6">
        <Button variant="text" size="sm">
          查看全部
        </Button>
        <Button variant="text" size="md">
          查看全部
        </Button>
        <Button variant="text" size="lg">
          查看全部
        </Button>
      </div>
    </div>
  ),
};

export const States: Story = {
  name: "禁用与加载",
  render: () => (
    <div className="grid grid-cols-[auto_auto_auto] items-center justify-start justify-items-start gap-x-4 gap-y-3">
      {(["control", "action", "light", "back", "danger", "text"] as const).map(
        (variant) => (
          <div key={variant} className="contents">
            <Button variant={variant}>提交申请</Button>
            <Button variant={variant} disabled>
              提交申请
            </Button>
            <Button variant={variant} loading loadingText="处理中">
              提交申请
            </Button>
          </div>
        ),
      )}
    </div>
  ),
};

export const Loading: Story = {
  name: "加载：宽度不变",
  render: function LoadingStory() {
    const [loading, setLoading] = useState(false);
    const run = () => {
      setLoading(true);
      window.setTimeout(() => setLoading(false), 1600);
    };
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Button loading={loading} loadingText="处理中" onClick={run}>
          保存设置
        </Button>
        <Button variant="action" loading={loading} onClick={run}>
          确认提交
        </Button>
        <p className="text-sm text-ink-secondary">
          点任意一个：记号变成旋转指示，按钮尺寸不跳动。
        </p>
      </div>
    );
  },
};

export const WithIcons: Story = {
  name: "带图标",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button iconStart={<Plus size={16} />}>新建条目</Button>
      <Button variant="light" iconEnd={<ArrowRight size={16} />}>
        下一步
      </Button>
      <Button variant="text" iconEnd={null}>
        不带箭头
      </Button>
    </div>
  ),
};

export const AsLink: Story = {
  name: "作为链接",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button href="#news">前往新闻</Button>
      <Button href="#news" variant="text">
        查看全部
      </Button>
      <Button href="#news" disabled>
        暂未开放
      </Button>
    </div>
  ),
};

/* 用路由库时把它的链接组件传给 render：长相、状态属性和事件都合并过去 */
export const WithRouter: Story = {
  name: "套路由库的链接",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button render={<RouterLink to="/archive" />}>查看档案</Button>
      <Button variant="text" render={<RouterLink to="/archive" />}>
        查看全部
      </Button>
      <Button disabled render={<RouterLink to="/archive" />}>
        暂未开放
      </Button>
    </div>
  ),
};

export const Group: Story = {
  name: "按钮组",
  render: () => (
    <div className="flex max-w-md flex-col gap-8">
      <ButtonGroup aria-label="表单操作">
        <Button variant="light">取消</Button>
        <Button>确认</Button>
      </ButtonGroup>
      <ButtonGroup align="between" aria-label="向导步骤">
        <Button variant="back">上一步</Button>
        <Button>下一步</Button>
      </ButtonGroup>
      <ButtonGroup align="start" gap="sm" aria-label="领取数量">
        <Button variant="light">领取 ×1</Button>
        <Button variant="action">领取 ×10</Button>
      </ButtonGroup>
      <ButtonGroup
        orientation="vertical"
        aria-label="窄栏里的操作"
        className="max-w-56"
      >
        <Button variant="light">稍后再说</Button>
        <Button>立即前往</Button>
      </ButtonGroup>
      <Button block size="lg">
        通宽按钮
      </Button>
    </div>
  ),
};
