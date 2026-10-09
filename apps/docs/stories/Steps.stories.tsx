import { Button, Step, Steps } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/* 文案全部虚构 */
const stages = [
  { title: "建站", description: "选址、供电、通信" },
  { title: "测绘", description: "布设信标，逐段量测" },
  { title: "复核", description: "现场和站里各过一遍" },
  { title: "归档", description: "按站点和月份存放" },
];

const children = stages.map((stage) => (
  <Step key={stage.title} title={stage.title} description={stage.description} />
));

const meta = {
  title: "控件/Steps 步骤条",
  component: Steps,
  args: {
    "aria-label": "建站流程",
    current: 1,
    orientation: "horizontal",
    size: "md",
    children,
  },
  argTypes: {
    current: { control: { type: "range", min: 0, max: 4, step: 1 } },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    children: { control: false },
  },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-2xl">
      <Steps {...args} />
    </div>
  ),
};

export const Vertical: Story = {
  name: "竖排",
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="max-w-xs">
      <Steps {...args} />
    </div>
  ),
};

export const States: Story = {
  name: "从头走到尾",
  render: () => (
    <div className="flex max-w-2xl flex-col gap-8">
      {[0, 2, 4].map((current) => (
        <Steps
          key={current}
          aria-label={`建站流程（第 ${current} 步）`}
          current={current}
        >
          {stages.map((stage) => (
            <Step key={stage.title} title={stage.title} />
          ))}
        </Steps>
      ))}
    </div>
  ),
};

export const Invalid: Story = {
  name: "有一步没填对",
  render: () => (
    <div className="max-w-2xl">
      <Steps aria-label="建站流程" current={2}>
        <Step title="建站" description="选址、供电、通信" />
        <Step title="测绘" description="有 3 个点没有量到" invalid />
        <Step title="复核" description="现场和站里各过一遍" />
        <Step title="归档" description="按站点和月份存放" />
      </Steps>
    </div>
  ),
};

function Wizard() {
  const [current, setCurrent] = useState(2);
  const last = stages.length - 1;
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Steps aria-label="建站流程" current={current}>
        {stages.map((stage, index) => (
          <Step
            key={stage.title}
            title={stage.title}
            description={stage.description}
            // 做过的步骤可以点回去；没到的不行
            onClick={index < current ? () => setCurrent(index) : undefined}
          />
        ))}
      </Steps>
      <p role="status" className="text-sm text-ink-secondary">
        {`现在是第 ${current + 1} 步：${stages[current]!.title}`}
      </p>
      <div className="flex gap-3">
        <Button
          variant="light"
          disabled={current === 0}
          onClick={() => setCurrent(current - 1)}
        >
          上一步
        </Button>
        <Button
          disabled={current === last}
          onClick={() => setCurrent(current + 1)}
        >
          下一步
        </Button>
      </div>
    </div>
  );
}

export const Clickable: Story = {
  name: "做过的步骤可以点回去",
  render: () => <Wizard />,
};

export const Small: Story = {
  name: "小一档",
  args: { size: "sm" },
  render: (args) => (
    <div className="max-w-xl">
      <Steps {...args} />
    </div>
  ),
};

export const Narrow: Story = {
  name: "窄容器里自动改成竖排",
  render: () => (
    <div className="w-64 border border-dashed border-line-strong p-3">
      <Steps aria-label="建站流程" current={1}>
        {children}
      </Steps>
    </div>
  ),
};
