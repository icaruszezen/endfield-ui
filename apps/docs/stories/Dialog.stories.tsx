import {
  Button,
  Dialog,
  DialogClose,
  Field,
  Input,
  PanelRow,
  PanelRows,
  Select,
  Textarea,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { IsoOutline } from "./_shared/IsoCube";

const meta = {
  title: "控件/Dialog 弹窗",
  component: Dialog,
  // 弹窗占的是整个视口，不能并排开两份
  parameters: { sideBySide: false },
  args: {
    title: "归档这份报告",
    description: "归档后它会从待办里移走，仍然可以在档案室里找到。",
    size: "md",
    alert: false,
    trigger: <Button>归档</Button>,
    footer: (
      <>
        <DialogClose>
          <Button variant="light">取消</Button>
        </DialogClose>
        <DialogClose>
          <Button>归档</Button>
        </DialogClose>
      </>
    ),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    trigger: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "三档宽度",
  render: (args) => (
    <div className="flex flex-wrap gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Dialog
          {...args}
          key={size}
          size={size}
          title={`${size} 档`}
          description="宽度跟着内容走，不要所有弹窗一个尺寸。"
          trigger={<Button variant="light">{size}</Button>}
        />
      ))}
    </div>
  ),
};

export const DangerConfirm: Story = {
  name: "破坏性操作的确认",
  render: () => (
    <Dialog
      alert
      size="sm"
      trigger={<Button variant="danger">销毁</Button>}
      title="销毁 3 件物资"
      description="销毁之后无法找回。锁定的物资不在其中。"
      footer={
        <>
          <DialogClose>
            <Button variant="light">取消</Button>
          </DialogClose>
          <DialogClose>
            {/* 按钮文字里写明后果 */}
            <Button variant="danger">销毁 3 件</Button>
          </DialogClose>
        </>
      }
    />
  ),
};

export const WithForm: Story = {
  name: "填几个字段",
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("北区仓储站");
    return (
      <div className="flex items-center gap-4">
        <Dialog
          open={open}
          onOpenChange={setOpen}
          trigger={<Button>重命名</Button>}
          title="重命名站点"
          footer={
            <>
              <DialogClose>
                <Button variant="light">取消</Button>
              </DialogClose>
              <Button onClick={() => setOpen(false)}>保存</Button>
            </>
          }
        >
          <div className="grid gap-5">
            <Field label="名称" required>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            {/* 弹窗里的下拉：面板要盖在弹窗上面 */}
            <Field label="所属地区">
              <Select
                defaultValue="ridge"
                items={[
                  { value: "valley", label: "四号谷地" },
                  { value: "ridge", label: "北岭" },
                  { value: "basin", label: "盐湖盆地" },
                ]}
              />
            </Field>
            <Field label="备注" help="只有本站的管理员能看到">
              <Textarea rows={3} />
            </Field>
          </div>
        </Dialog>
        <span className="text-sm text-ink-secondary">当前：{name}</span>
      </div>
    );
  },
};

export const LongContent: Story = {
  name: "内容很长时只有正文滚动",
  render: () => (
    <Dialog
      trigger={<Button variant="light">查看盘点记录</Button>}
      title="盘点记录"
      footer={
        <DialogClose>
          <Button>知道了</Button>
        </DialogClose>
      }
    >
      <PanelRows className="px-0">
        {Array.from({ length: 24 }, (_, index) => (
          <PanelRow key={index} label={`第 ${index + 1} 批`}>
            {(index * 37 + 120) % 900}
          </PanelRow>
        ))}
      </PanelRows>
    </Dialog>
  ),
};

/* 默认打开，供截图核对。不进文档页：文档页会把所有 story 同时渲染出来 */
export const Decorated: Story = {
  name: "两处可选装饰",
  args: {
    ornament: true,
    cornerArt: <IsoOutline />,
    trigger: <Button variant="light">查看批次</Button>,
    title: "第 12 批次",
    description: "标题下的小方点和左下角的线稿都是装饰，默认关着。",
    footer: (
      <DialogClose>
        <Button>知道了</Button>
      </DialogClose>
    ),
  },
};

export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  args: { defaultOpen: true },
};

export const OpenAlert: Story = {
  name: "打开的样子（确认）",
  tags: ["!autodocs"],
  args: {
    defaultOpen: true,
    alert: true,
    size: "sm",
    title: "销毁 3 件物资",
    description: "销毁之后无法找回。锁定的物资不在其中。",
    trigger: <Button variant="danger">销毁</Button>,
    footer: (
      <>
        <DialogClose>
          <Button variant="light">取消</Button>
        </DialogClose>
        <DialogClose>
          <Button variant="danger">销毁 3 件</Button>
        </DialogClose>
      </>
    ),
  },
};

export const OpenDecorated: Story = {
  name: "打开的样子（带装饰）",
  tags: ["!autodocs"],
  args: {
    defaultOpen: true,
    ornament: true,
    cornerArt: <IsoOutline />,
    title: "第 12 批次",
    description: "标题下的小方点和左下角的线稿都是装饰，默认关着。",
  },
};
