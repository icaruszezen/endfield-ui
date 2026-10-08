import {
  Button,
  ButtonGroup,
  Field,
  IconButton,
  Input,
  Popover,
  PopoverClose,
  StatusInfo,
  Switch,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Popover 气泡卡片",
  component: Popover,
  args: {
    side: "bottom",
    align: "start",
    title: "显示",
    description: "只影响这一页，换一页还是默认的样子。",
    trigger: <Button variant="light">显示设置</Button>,
    children: (
      <>
        <div className="flex flex-col">
          <Switch defaultChecked>缩略图</Switch>
          <Switch>紧凑行距</Switch>
        </div>
        <ButtonGroup align="end">
          <PopoverClose>
            <Button size="sm">完成</Button>
          </PopoverClose>
        </ButtonGroup>
      </>
    ),
  },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "bottom", "left", "right"],
    },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const QuickEdit: Story = {
  name: "快速改一个字段",
  render: function Render() {
    const [name, setName] = useState("北岭三号站");
    const [draft, setDraft] = useState(name);
    const [open, setOpen] = useState(false);
    return (
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">{name}</span>
        <Popover
          open={open}
          onOpenChange={(next) => {
            // 每次打开都从当前的名字开始改
            if (next) setDraft(name);
            setOpen(next);
          }}
          title="重命名"
          trigger={
            <Button variant="text" iconEnd={null}>
              改名
            </Button>
          }
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setName(draft.trim() || name);
              setOpen(false);
            }}
          >
            <Field label="站点名称">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </Field>
            <ButtonGroup align="end">
              <PopoverClose>
                <Button variant="light" size="sm">
                  取消
                </Button>
              </PopoverClose>
              <Button type="submit" size="sm">
                保存
              </Button>
            </ButtonGroup>
          </form>
        </Popover>
      </div>
    );
  },
};

export const Explain: Story = {
  name: "带链接的说明",
  render: () => (
    <div className="flex items-center gap-2">
      <span>本周配额 1,280 件</span>
      {/* 没有标题：自己给面板一个名称 */}
      <Popover
        aria-label="配额怎么算"
        align="center"
        trigger={
          <IconButton aria-label="配额怎么算">
            <StatusInfo />
          </IconButton>
        }
      >
        <p>
          配额按上一周的实际消耗重新核定，每周一 04:00
          生效。临时追加的部分不计入下一周的基数。
        </p>
        <a href="#quota" className="underline underline-offset-4">
          查看核定记录
        </a>
      </Popover>
    </div>
  ),
};

export const Placement: Story = {
  name: "放在右边缘时改成右对齐",
  render: (args) => (
    <div className="flex justify-end">
      <Popover {...args} align="end" />
    </div>
  ),
};

/* 默认打开，供截图核对。不进文档页 */
export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  args: { defaultOpen: true },
  decorators: [
    (Story) => (
      <div className="min-h-72">
        <Story />
      </div>
    ),
  ],
};
