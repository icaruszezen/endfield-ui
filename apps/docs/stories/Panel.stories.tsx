import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuItem,
  IconButton,
  Panel,
  PanelBody,
  PanelHeader,
  PanelRow,
  PanelRows,
  Tag,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreIcon } from "./_shared/ResourceIcons";

const meta = {
  title: "控件/Panel 面板",
  component: Panel,
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  ["采样点", "128"],
  ["已完成", "96"],
  ["平均深度", "42.5 m"],
  ["最近更新", "2026.10.08"],
] as const;

export const Band: Story = {
  name: "band 标题带",
  render: () => (
    <Panel className="max-w-sm">
      <PanelHeader extra={<span className="font-tech">04</span>}>
        测绘进度
      </PanelHeader>
      <PanelRows>
        {rows.map(([label, value]) => (
          <PanelRow key={label} label={label}>
            {value}
          </PanelRow>
        ))}
      </PanelRows>
    </Panel>
  ),
};

export const Line: Story = {
  name: "line 细线标题",
  render: () => (
    <Panel className="max-w-sm">
      <PanelHeader
        variant="line"
        extra={
          <Tag size="sm" variant="outline">
            草稿
          </Tag>
        }
      >
        勘探说明
      </PanelHeader>
      <PanelBody className="text-sm text-ink-secondary">
        面板的底色只比页面差一档，靠 1px 的线分层。没有圆角，也没有阴影。
      </PanelBody>
      <PanelBody className="flex justify-end gap-3 border-t border-line">
        <Button size="sm" variant="light">
          取消
        </Button>
        <Button size="sm">保存</Button>
      </PanelBody>
    </Panel>
  ),
};

/*
 * 标题带是一个反转主题：放进去的控件按这条带子的底色取值，不用另外处理。
 * 用 Tab 走一遍——焦点环在亮、暗两个主题下都看得见
 */
export const BandControls: Story = {
  name: "标题带里的控件",
  render: () => (
    <Panel className="max-w-md">
      <PanelHeader
        extra={
          <>
            <Checkbox defaultChecked>只看未完成</Checkbox>
            <Tag size="sm" variant="outline">
              草稿
            </Tag>
            <Button size="sm" variant="text">
              导出
            </Button>
            <DropdownMenu
              align="end"
              trigger={
                <IconButton size="sm" aria-label="更多操作">
                  <MoreIcon />
                </IconButton>
              }
            >
              <DropdownMenuItem>重新测绘</DropdownMenuItem>
              <DropdownMenuItem>归档</DropdownMenuItem>
            </DropdownMenu>
          </>
        }
      >
        测绘进度
      </PanelHeader>
      <PanelRows>
        {rows.map(([label, value]) => (
          <PanelRow key={label} label={label}>
            {value}
          </PanelRow>
        ))}
      </PanelRows>
    </Panel>
  ),
};

export const Borderless: Story = {
  name: "不描边",
  render: () => (
    <Panel bordered={false} className="max-w-sm">
      <PanelBody className="text-sm text-ink-secondary">
        只靠底色差分层的面板。
      </PanelBody>
    </Panel>
  ),
};
