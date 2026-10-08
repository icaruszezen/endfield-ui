import { Tag, TagPair } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Tag 标签",
  component: Tag,
  args: { children: "PV" },
  argTypes: {
    variant: {
      control: "select",
      options: ["solid", "outline", "inverse", "muted", "accent", "gain"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: "变体",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <Tag size={size} variant="solid">
            PV
          </Tag>
          <Tag size={size} variant="outline">
            限时活动
          </Tag>
          <Tag size={size} variant="inverse">
            档案
          </Tag>
          <Tag size={size} variant="muted">
            已归档
          </Tag>
          <Tag size={size} variant="accent" className="font-tech font-bold">
            NEW
          </Tag>
        </div>
      ))}
    </div>
  ),
};

export const Pairs: Story = {
  name: "名值对",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <TagPair name="所属" value="第七勘探队" />
        <TagPair name="职能" value="地质测绘" />
        <TagPair name="记录员" value="示例姓名" emphasis />
      </div>
      <div className="flex flex-wrap gap-2">
        <TagPair size="sm" name="所属" value="第七勘探队" />
        <TagPair size="sm" name="职能" value="地质测绘" />
        <TagPair size="sm" name="记录员" value="示例姓名" emphasis />
      </div>
    </div>
  ),
};

export const DateBlock: Story = {
  name: "日期块与微标行",
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Tag variant="inverse" numeric>
          10.08
        </Tag>
        <p className="font-tech text-xs text-ink-secondary">
          // 新闻　2026.10.08
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Tag variant="inverse" numeric marked>
          10.21
        </Tag>
        <p className="font-tech text-xs text-ink-secondary">
          // 维护　2026.10.21　小红角标出需要留意的日期
        </p>
      </div>
    </div>
  ),
};

export const Gain: Story = {
  name: "增益签",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Tag variant="gain" numeric>
        +6%
      </Tag>
      <Tag variant="gain" size="sm" numeric>
        +128
      </Tag>
      <span className="font-tech text-sm font-bold text-danger tabular-nums">
        −2%
      </span>
      <p className="text-sm text-ink-secondary">
        上升用增益签；下降用危险色文字加负号。
      </p>
    </div>
  ),
};
