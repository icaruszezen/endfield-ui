import {
  Button,
  Panel,
  PanelBody,
  PanelHeader,
  PanelRow,
  PanelRows,
  Tag,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

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
