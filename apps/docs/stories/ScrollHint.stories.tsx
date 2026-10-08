import { ScrollHint } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";

const meta = {
  title: "控件/ScrollHint 滚动提示",
  component: ScrollHint,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof ScrollHint>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 一个能滚动的"首屏"：提示停在底部，往下滚一点它就淡出 */
function Frame({
  variant,
  long = true,
}: {
  variant?: "line" | "chevron";
  long?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="relative w-64 border border-line">
      <div ref={scroller} className="h-72 overflow-y-auto">
        <div className="flex h-72 items-center justify-center bg-surface-sunken font-tech text-xs text-ink-tertiary">
          {long ? "往下滚动试试" : "内容只有一屏"}
        </div>
        {long && (
          <div className="flex flex-col gap-3 p-4 text-sm text-ink-secondary">
            {Array.from({ length: 8 }, (_, line) => (
              <p key={line}>第 {line + 1} 段正文。回到顶部后提示会重新出现。</p>
            ))}
          </div>
        )}
      </div>
      <ScrollHint
        variant={variant}
        target={scroller}
        className="absolute bottom-3 left-1/2 -translate-x-1/2"
      />
    </div>
  );
}

export const Line: Story = {
  name: "细竖线 + 光点",
  render: () => <Frame />,
};

export const Chevron: Story = {
  name: "折线箭头（窄屏）",
  render: () => <Frame variant="chevron" />,
};

export const NothingToScroll: Story = {
  name: "滚不动时不出现",
  render: () => <Frame long={false} />,
};
