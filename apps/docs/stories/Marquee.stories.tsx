import { Button, Marquee } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Marquee 跑马灯",
  component: Marquee,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GhostText: Story = {
  name: "巨字",
  render: () => (
    // 纯装饰的巨字对读屏隐藏
    <Marquee aria-hidden="true" duration={24} gap="4rem">
      <span className="font-display text-5xl font-bold tracking-ghost whitespace-nowrap text-surface-muted uppercase">
        Survey Archive // Field Notes
      </span>
    </Marquee>
  ),
};

function Notice() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex max-w-md flex-col items-start gap-3">
      <div className="flex w-full items-center gap-3 border-y border-line py-2">
        <span className="shrink-0 font-tech text-xs text-ink-secondary">
          {"// 通知"}
        </span>
        <Marquee paused={paused} className="min-w-0 flex-1 text-sm">
          <span className="whitespace-nowrap">
            终端将于 10 月 21 日凌晨 2 点至 6
            点停机维护，期间无法提交采样记录，请提前保存草稿。
          </span>
        </Marquee>
      </div>
      {/* 会动的内容要给一个停下来的办法：悬停会暂停，键盘用户用这个按钮 */}
      <Button
        variant="light"
        size="sm"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? "继续滚动" : "暂停滚动"}
      </Button>
    </div>
  );
}

export const LongLine: Story = {
  name: "过长的单行文字",
  render: () => <Notice />,
};

export const OverflowOnly: Story = {
  name: "放得下就不动",
  render: () => (
    <div className="flex flex-col gap-4">
      {["w-40", "w-96"].map((width) => (
        <div
          key={width}
          className={`${width} border border-dashed border-line-strong p-2`}
        >
          <Marquee overflowOnly duration={8} className="text-sm">
            <span className="whitespace-nowrap">
              第七勘探区北段管廊 · 第二采样点
            </span>
          </Marquee>
        </div>
      ))}
    </div>
  ),
};
