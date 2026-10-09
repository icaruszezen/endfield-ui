import {
  Button,
  Field,
  Input,
  Segment,
  SegmentedControl,
  Select,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type FormEvent } from "react";

/* 文案全部虚构；图标是原创的几何图形 */
const meta = {
  title: "控件/SegmentedControl 分段选择",
  component: SegmentedControl,
  args: {
    "aria-label": "时间显示",
    defaultValue: "24",
    size: "md",
    variant: "sunken",
    disabled: false,
    children: (
      <>
        <Segment value="24">24 小时</Segment>
        <Segment value="12">12 小时</Segment>
        <Segment value="auto">跟随系统</Segment>
      </>
    ),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["sunken", "outline"] },
    children: { control: false },
    value: { control: false },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "三档尺寸",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <SegmentedControl
          key={size}
          aria-label={`密度（${size}）`}
          size={size}
          defaultValue="standard"
        >
          <Segment value="compact">紧凑</Segment>
          <Segment value="standard">标准</Segment>
          <Segment value="loose">宽松</Segment>
        </SegmentedControl>
      ))}
    </div>
  ),
};

export const Outline: Story = {
  name: "描边（放在凹陷底色的区域里）",
  render: () => (
    <div className="flex flex-wrap items-end gap-4 bg-surface-sunken p-4">
      <Field label="检索" className="min-w-40 flex-1">
        <Input variant="outline" placeholder="标题里的关键词" />
      </Field>
      <Field label="视图">
        <SegmentedControl variant="outline" defaultValue="grid">
          <Segment value="grid">网格</Segment>
          <Segment value="list">列表</Segment>
        </SegmentedControl>
      </Field>
    </div>
  ),
};

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" />
    </svg>
  );
}

function RowsIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M2 3h12v2H2zM2 7h12v2H2zM2 11h12v2H2z" />
    </svg>
  );
}

export const WithIcons: Story = {
  name: "带图标；只有图标",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <SegmentedControl aria-label="视图" defaultValue="grid">
        <Segment value="grid" icon={<GridIcon />}>
          网格
        </Segment>
        <Segment value="list" icon={<RowsIcon />}>
          列表
        </Segment>
      </SegmentedControl>
      <SegmentedControl aria-label="视图（只有图标）" defaultValue="list">
        <Segment value="grid" aria-label="网格" icon={<GridIcon />} />
        <Segment value="list" aria-label="列表" icon={<RowsIcon />} />
      </SegmentedControl>
    </div>
  ),
};

export const States: Story = {
  name: "状态：没选、禁用、单独禁用一段",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <SegmentedControl aria-label="还没选">
        <Segment value="a">甲班</Segment>
        <Segment value="b">乙班</Segment>
        <Segment value="c">丙班</Segment>
      </SegmentedControl>
      <SegmentedControl aria-label="整组禁用" defaultValue="b" disabled>
        <Segment value="a">甲班</Segment>
        <Segment value="b">乙班</Segment>
        <Segment value="c">丙班</Segment>
      </SegmentedControl>
      <SegmentedControl aria-label="一段禁用" defaultValue="a">
        <Segment value="a">甲班</Segment>
        <Segment value="b">乙班</Segment>
        <Segment value="c" disabled>
          丙班（停用）
        </Segment>
      </SegmentedControl>
    </div>
  ),
};

function InFieldExample() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const shift = data.get("shift");
    setMissing(shift === null);
    setSubmitted(
      shift === null ? null : `clock=${data.get("clock")}&shift=${shift}`,
    );
  };
  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex max-w-sm flex-col gap-5"
    >
      <Field label="时间显示" help="只影响这台终端。">
        <SegmentedControl name="clock" defaultValue="24">
          <Segment value="24">24 小时</Segment>
          <Segment value="12">12 小时</Segment>
        </SegmentedControl>
      </Field>
      <Field
        label="值守班次"
        required
        error={missing ? "还没选班次，请选一个。" : undefined}
      >
        <SegmentedControl
          name="shift"
          className="w-full"
          onValueChange={() => setMissing(false)}
        >
          <Segment value="a">甲班</Segment>
          <Segment value="b">乙班</Segment>
          <Segment value="c">丙班</Segment>
        </SegmentedControl>
      </Field>
      <Field label="上报周期">
        <Select
          items={[
            { value: "day", label: "每天" },
            { value: "week", label: "每周" },
          ]}
          defaultValue="day"
        />
      </Field>
      <div className="flex items-center gap-4">
        <Button type="submit">保存</Button>
        <output className="font-tech text-xs text-ink-secondary">
          {submitted ?? "// 还没提交"}
        </output>
      </div>
    </form>
  );
}

export const InField: Story = {
  name: "放进字段，随表单提交",
  render: () => <InFieldExample />,
};

export const Narrow: Story = {
  name: "窄容器里不溢出",
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <SegmentedControl aria-label="上报周期" defaultValue="week">
        <Segment value="day">每天上报一次</Segment>
        <Segment value="week">每周上报一次</Segment>
        <Segment value="month">每月上报一次</Segment>
      </SegmentedControl>
    </div>
  ),
};
