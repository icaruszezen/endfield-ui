import {
  Button,
  ButtonGroup,
  ToastProvider,
  useToast,
  type ToastOptions,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

const meta = {
  title: "控件/Toast 轻提示",
  component: ToastProvider,
  // 轻提示占的是整个视口，不能并排开两份
  parameters: { sideBySide: false },
  // children 由各个 story 的 render 给
  args: { placement: "bottom", duration: 3000, children: null },
  argTypes: {
    placement: { control: "inline-radio", options: ["bottom", "center"] },
    children: { control: false },
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function Triggers() {
  const toast = useToast();
  const [destroyed, setDestroyed] = useState(0);
  return (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup align="start">
        <Button variant="light" onClick={() => toast("已保存")}>
          一句话
        </Button>
        <Button
          variant="light"
          onClick={() => toast({ message: "已归档 3 份报告", tone: "success" })}
        >
          成功
        </Button>
        <Button
          variant="light"
          onClick={() =>
            toast({ message: "保存失败，请检查网络后重试", tone: "danger" })
          }
        >
          失败
        </Button>
        <Button
          variant="light"
          onClick={() => {
            setDestroyed((count) => count + 3);
            toast({
              message: "已销毁 3 件物资",
              action: {
                label: "撤销",
                onClick: () => setDestroyed((count) => count - 3),
              },
            });
          }}
        >
          带操作
        </Button>
        <Button
          variant="light"
          onClick={() =>
            toast({ message: "连接已断开", tone: "warning", duration: 0 })
          }
        >
          一直留着
        </Button>
        <Button variant="text" iconEnd={null} onClick={() => toast.dismiss()}>
          关掉
        </Button>
      </ButtonGroup>
      <p className="text-sm text-ink-secondary">已销毁：{destroyed} 件</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <Triggers />
    </ToastProvider>
  ),
};

export const Centered: Story = {
  name: "视口正中",
  args: { placement: "center" },
  render: (args) => (
    <ToastProvider {...args}>
      <Triggers />
    </ToastProvider>
  ),
};

/* 挂载后自己弹一条并留着，供截图核对。不进文档页 */
function Pinned({ options }: { options: ToastOptions }) {
  const toast = useToast();
  useEffect(() => {
    const id = toast({ ...options, duration: 0 });
    return () => toast.dismiss(id);
  }, [toast, options]);
  return <p className="text-sm text-ink-secondary">页面上的其他内容照常可用。</p>;
}

const pinnedPlain: ToastOptions = { message: "已保存" };
const pinnedAction: ToastOptions = {
  message: "已销毁 3 件物资",
  tone: "success",
  action: { label: "撤销", onClick: () => {} },
};
const pinnedDanger: ToastOptions = {
  message: "保存失败，请检查网络后重试",
  tone: "danger",
};

export const OpenPlain: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  render: (args) => (
    <ToastProvider {...args}>
      <Pinned options={pinnedPlain} />
    </ToastProvider>
  ),
};

export const OpenAction: Story = {
  name: "打开的样子（带操作）",
  tags: ["!autodocs"],
  render: (args) => (
    <ToastProvider {...args}>
      <Pinned options={pinnedAction} />
    </ToastProvider>
  ),
};

export const OpenDanger: Story = {
  name: "打开的样子（失败）",
  tags: ["!autodocs"],
  args: { placement: "center" },
  render: (args) => (
    <ToastProvider {...args}>
      <Pinned options={pinnedDanger} />
    </ToastProvider>
  ),
};
