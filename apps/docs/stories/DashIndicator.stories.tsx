import {
  ChevronLeft,
  ChevronRight,
  DashIndicator,
  IconButton,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/DashIndicator 进度短横",
  component: DashIndicator,
  args: { count: 5, index: 1 },
  argTypes: {
    count: { control: { type: "range", min: 1, max: 12 } },
    index: { control: { type: "range", min: 0, max: 11 } },
  },
} satisfies Meta<typeof DashIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Counts: Story = {
  name: "不同数量",
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <DashIndicator count={3} index={0} />
      <DashIndicator count={5} index={2} />
      <DashIndicator count={8} index={7} />
    </div>
  ),
};

function Paged() {
  const count = 5;
  const [index, setIndex] = useState(0);
  return (
    <div className="flex items-center gap-4">
      <IconButton
        variant="floating"
        aria-label="上一张"
        disabled={index === 0}
        onClick={() => setIndex(index - 1)}
      >
        <ChevronLeft />
      </IconButton>
      <DashIndicator count={count} index={index} />
      <IconButton
        variant="floating"
        aria-label="下一张"
        disabled={index === count - 1}
        onClick={() => setIndex(index + 1)}
      >
        <ChevronRight />
      </IconButton>
    </div>
  );
}

export const WithPager: Story = {
  name: "配一对翻页钮",
  render: () => <Paged />,
};
