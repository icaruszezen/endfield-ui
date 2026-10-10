import {
  Button,
  DataRow,
  DataRowList,
  RollingNumber,
  Stat,
} from "@endfield-ui/react";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/* 单独摆出来看的时候给它统计块那样的大号等宽数字；放进别的控件里的 story 不套这一层 */
const asFigure: Decorator = (Story) => (
  <div className="font-tech text-4xl font-medium tabular-nums">
    <Story />
  </div>
);

const meta = {
  title: "控件/RollingNumber 滚动数字",
  component: RollingNumber,
  args: { value: 1280, animate: true },
  argTypes: {
    value: { control: "number" },
    format: { control: false },
  },
} satisfies Meta<typeof RollingNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { decorators: [asFigure] };

export const Entrance: Story = {
  name: "入场动画",
  render: function EntranceStory(args) {
    const [run, setRun] = useState(0);
    return (
      <div className="flex flex-col items-start gap-6">
        <Stat
          key={run}
          label="TOTAL"
          value={<RollingNumber {...args} />}
          unit="件"
          delta="+6%"
        />
        <Button size="sm" onClick={() => setRun((value) => value + 1)}>
          重播
        </Button>
        <p className="text-sm text-ink-secondary">
          数字从 0 滚到终值，进入视口时只滚一次。滚的时候宽度由终值占着，
          旁边的单位和增量签不动。
        </p>
      </div>
    );
  },
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

export const Formats: Story = {
  name: "小数、负数、自定义写法",
  render: () => (
    <div className="flex flex-wrap gap-x-12 gap-y-8">
      <Stat label="DEPTH" value={<RollingNumber value={42.5} />} unit="m" />
      <Stat label="BALANCE" value={<RollingNumber value={-320} />} unit="件" />
      <Stat
        label="RATE"
        value={<RollingNumber value={0.86} format={percent} />}
      />
      <Stat
        label="OUTPUT"
        value={<RollingNumber value={1280640} />}
        unit="件"
      />
    </div>
  ),
};

/* 数据行带的当前值是靠右排的：数字从右边往左长，位置由终值占着 */
export const InDataRow: Story = {
  name: "放进数据行带",
  render: () => (
    <DataRowList
      label="今日产出"
      columns={{
        name: "名称",
        trend: "走势",
        value: "当前",
        reference: "上限",
      }}
      className="max-w-2xl"
    >
      <DataRow
        name="合金板材"
        series={[42, 58, 51, 77, 69, 88, 80, 96]}
        value={<RollingNumber value={1280} />}
        tone="info"
        reference="1,500"
      />
      <DataRow
        name="冷却液"
        series={[64, 60, 71, 55, 62, 48, 57, 44]}
        value={<RollingNumber value={342} />}
        tone="danger"
        reference="300"
      />
    </DataRowList>
  ),
};

export const Static: Story = {
  name: "不滚",
  args: { animate: false },
  decorators: [asFigure],
};
