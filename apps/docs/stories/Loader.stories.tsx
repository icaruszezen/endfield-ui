import { Button, Loader } from "@endfield-ui/react";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState, type ReactNode } from "react";

/*
 * 加载页默认铺满视口并锁住页面。这里为了能和别的 story 并排看，
 * 都关掉 fullscreen，放进一个定高的框里——框要有定位并裁掉溢出，滑出时才不会露到外面。
 */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-72 max-w-xl overflow-hidden border border-line">
      <div className="flex h-full items-center justify-center text-sm text-ink-secondary">
        页面内容
      </div>
      {children}
    </div>
  );
}

const meta = {
  title: "控件/Loader 加载页",
  component: Loader,
  args: { value: 64, tagline: "正在同步档案", fullscreen: false },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
  },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

const framed: Decorator = (Story) => (
  <Frame>
    <Story />
  </Frame>
);

export const Playground: Story = { decorators: [framed] };

export const Indeterminate: Story = {
  name: "不确定进度",
  decorators: [framed],
  args: { value: undefined, tagline: "正在连接终端" },
};

export const Narrow: Story = {
  name: "窄容器",
  decorators: [
    (Story) => (
      <div className="relative h-64 w-56 overflow-hidden border border-line">
        <Story />
      </div>
    ),
  ],
};

/** 充填 → 揭示：进度到 100 就立刻退出，不为了播完动画多等 */
function Sequence() {
  const [run, setRun] = useState(0);
  const [value, setValue] = useState(0);
  const done = value >= 100;

  useEffect(() => {
    setValue(0);
    const timer = window.setInterval(() => {
      setValue((current) => Math.min(100, current + 7));
    }, 160);
    return () => window.clearInterval(timer);
  }, [run]);

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="relative h-72 w-full max-w-xl overflow-hidden border border-line">
        <div className="flex h-full items-center justify-center text-sm text-ink-secondary">
          页面内容
        </div>
        <Loader
          key={run}
          fullscreen={false}
          value={value}
          open={!done}
          tagline="正在同步档案"
        />
      </div>
      <Button variant="light" size="sm" onClick={() => setRun(run + 1)}>
        重播
      </Button>
    </div>
  );
}

export const Reveal: Story = {
  name: "充填后揭示",
  render: () => <Sequence />,
};
