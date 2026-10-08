import {
  Button,
  ChevronDown,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  IconButton,
  Kbd,
  Lock,
  Plus,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MoreIcon } from "./_shared/ResourceIcons";

const items = (
  <>
    <DropdownMenuGroup label="条目">
      <DropdownMenuItem iconStart={<Plus />}>复制一份</DropdownMenuItem>
      <DropdownMenuItem iconStart={<Lock />} end={<Kbd size="sm">L</Kbd>}>
        锁定
      </DropdownMenuItem>
      <DropdownMenuItem disabled>移动到…</DropdownMenuItem>
      <DropdownMenuItem href="#detail">查看详情</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    {/* 危险项放在最后，和其他项隔开 */}
    <DropdownMenuItem tone="danger">销毁</DropdownMenuItem>
  </>
);

const meta = {
  title: "控件/DropdownMenu 下拉菜单",
  component: DropdownMenu,
  args: {
    variant: "plain",
    side: "bottom",
    align: "start",
    trigger: (
      <IconButton aria-label="更多操作">
        <MoreIcon />
      </IconButton>
    ),
    children: items,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["plain", "strong"] },
    side: {
      control: "inline-radio",
      options: ["top", "bottom", "left", "right"],
    },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ButtonTrigger: Story = {
  name: "按钮触发",
  args: {
    trigger: (
      <Button variant="light" iconEnd={<ChevronDown size={16} />}>
        操作
      </Button>
    ),
  },
};

export const Sorting: Story = {
  name: "单选组：当前项",
  render: function Render() {
    const [sort, setSort] = useState("count");
    const label = { count: "按数量", rarity: "按稀有度", name: "按名称" }[sort];
    return (
      <DropdownMenu
        trigger={
          <Button variant="light" iconEnd={<ChevronDown size={16} />}>
            排序：{label}
          </Button>
        }
      >
        <DropdownMenuRadioGroup
          label="排序方式"
          value={sort}
          onValueChange={setSort}
        >
          <DropdownMenuRadioItem value="count">按数量</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="rarity">按稀有度</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name">按名称</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenu>
    );
  },
};

export const Language: Story = {
  name: "深色面板：语言菜单",
  render: function Render() {
    const [language, setLanguage] = useState("zh");
    return (
      <DropdownMenu
        variant="strong"
        align="end"
        trigger={
          <Button variant="light" size="sm">
            语言
          </Button>
        }
      >
        <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
          <DropdownMenuRadioItem value="zh">简体中文</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ja">日本語</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenu>
    );
  },
};

/* 默认打开，供截图核对。不进文档页；菜单打开时页面其余部分不可交互，所以也不并排 */
export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { defaultOpen: true },
};

export const OpenStrong: Story = {
  name: "打开的样子（深色面板）",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: {
    defaultOpen: true,
    variant: "strong",
    trigger: (
      <Button variant="light" size="sm">
        语言
      </Button>
    ),
    children: (
      <DropdownMenuRadioGroup defaultValue="zh">
        <DropdownMenuRadioItem value="zh">简体中文</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="ja">日本語</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ),
  },
};
