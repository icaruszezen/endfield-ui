import { List, ListRow, Tag } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/List 列表行",
  component: List,
  parameters: { controls: { disable: true } },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

const samples = [
  { id: "a", name: "管廊北段", depth: "42.5 m", date: "10.08" },
  { id: "b", name: "第三岩层", depth: "118.0 m", date: "10.05" },
  { id: "c", name: "旧输料口", depth: "9.2 m", date: "09.28" },
  { id: "d", name: "沉降观测点", depth: "0.6 m", date: "09.21" },
];

export const Static: Story = {
  name: "静态行",
  render: () => (
    <List>
      {samples.map((sample) => (
        <ListRow key={sample.id} end={sample.depth}>
          {sample.name}
        </ListRow>
      ))}
    </List>
  ),
};

function Selectable() {
  const [current, setCurrent] = useState("b");
  return (
    <List aria-label="采样点">
      {samples.map((sample) => (
        <ListRow
          key={sample.id}
          selected={sample.id === current}
          onClick={() => setCurrent(sample.id)}
          start={
            <Tag variant="inverse" size="sm" numeric>
              {sample.date}
            </Tag>
          }
          end={sample.depth}
          description={`// 采样　2026.${sample.date}`}
        >
          {sample.name}
        </ListRow>
      ))}
    </List>
  );
}

export const Selection: Story = {
  name: "可选中的行",
  render: () => <Selectable />,
};

export const Links: Story = {
  name: "链接行与禁用",
  render: () => (
    <List>
      <ListRow href="#north" end="42.5 m">
        管廊北段
      </ListRow>
      <ListRow href="#layer" end="118.0 m" selected>
        第三岩层
      </ListRow>
      <ListRow href="#inlet" end="—" disabled description="尚未开放">
        旧输料口
      </ListRow>
    </List>
  ),
};

export const Compact: Story = {
  name: "紧凑行高",
  render: () => (
    <List>
      {samples.map((sample) => (
        <ListRow key={sample.id} size="sm" end={sample.depth}>
          {sample.name}
        </ListRow>
      ))}
    </List>
  ),
};

export const Narrow: Story = {
  name: "窄容器里截断",
  render: () => (
    <div className="w-52 border border-dashed border-line-strong">
      <List>
        <ListRow end="118.0 m" description="// 采样　2026.10.05">
          第三岩层东侧的补充采样点
        </ListRow>
        <ListRow end="9.2 m">旧输料口</ListRow>
      </List>
    </div>
  ),
};

export const Completed: Story = {
  name: "完成态",
  render: () => (
    <List>
      <ListRow completed end="2026.10.05">
        校准传感器
      </ListRow>
      <ListRow completed end="2026.10.06" description="// 第二班">
        更换滤芯
      </ListRow>
      <ListRow end="进行中" selected>
        复核采样记录
      </ListRow>
      <ListRow end="未开始">归档</ListRow>
      <ListRow completed completedWord={null} size="sm" end="2026.10.02">
        不带描边词的小号行
      </ListRow>
    </List>
  ),
};

function BandSelectable() {
  const [current, setCurrent] = useState("b");
  return (
    <List variant="band" aria-label="采样点">
      {samples.map((sample) => (
        <ListRow
          key={sample.id}
          selected={sample.id === current}
          onClick={() => setCurrent(sample.id)}
          start={
            <Tag variant="inverse" size="sm" numeric>
              {sample.date}
            </Tag>
          }
          end={sample.depth}
          description={`// 采样　2026.${sample.date}`}
        >
          {sample.name}
        </ListRow>
      ))}
    </List>
  );
}

export const Band: Story = {
  name: "深色行带：选中行反转成白底",
  render: () => <BandSelectable />,
};

export const BandStates: Story = {
  name: "深色行带：链接、禁用、完成与紧凑",
  render: () => (
    <List variant="band">
      <ListRow href="#north" end="42.5 m">
        管廊北段
      </ListRow>
      <ListRow href="#layer" end="118.0 m" disabled>
        第三岩层（封闭中）
      </ListRow>
      <ListRow completed end="9.2 m">
        旧输料口
      </ListRow>
      <ListRow size="sm" end="0.6 m">
        沉降观测点
      </ListRow>
    </List>
  ),
};
