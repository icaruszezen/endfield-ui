import { Alert, Button } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Alert 提示条",
  component: Alert,
  args: { children: "终端将于 10 月 21 日凌晨停机维护，预计两小时。" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["info", "success", "warning", "danger"],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  name: "四种色调，四种形状",
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <Alert tone="info">终端将于 10 月 21 日凌晨停机维护，预计两小时。</Alert>
      <Alert tone="success">测绘数据已归档。</Alert>
      <Alert tone="warning">补给余量不足三天，请尽快申请。</Alert>
      <Alert tone="danger">同步失败：网络连接已断开。</Alert>
    </div>
  ),
};

export const WithTitle: Story = {
  name: "标题与操作",
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <Alert
        tone="danger"
        title="有 2 项没有填对"
        action={
          <Button variant="text" size="sm" iconEnd={null}>
            查看
          </Button>
        }
      >
        代号不能为空；备注超过了 200 字。
      </Alert>
      <Alert tone="warning" title="补给余量不足">
        按当前消耗，燃料还能支撑三天。
      </Alert>
    </div>
  ),
};

function Dismissible() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex max-w-xl flex-col items-start gap-3">
      {open ? (
        <Alert className="w-full" onClose={() => setOpen(false)}>
          新的勘探路线建议已开放征集。
        </Alert>
      ) : (
        <Button variant="light" onClick={() => setOpen(true)}>
          再显示一次
        </Button>
      )}
    </div>
  );
}

export const Closable: Story = {
  name: "可关闭",
  render: () => <Dismissible />,
};

export const Narrow: Story = {
  name: "窄容器里不溢出",
  render: () => (
    <div className="w-56">
      <Alert tone="warning" title="补给余量不足" onClose={() => {}}>
        按当前消耗，燃料还能支撑三天。
      </Alert>
    </div>
  ),
};
