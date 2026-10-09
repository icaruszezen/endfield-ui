import { PlayButton, PlayMark } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ScenePlaceholder } from "./_shared/Placeholders";

/* 画面是原创的灰色占位图，不是任何游戏的截图 */
const meta = {
  title: "控件/PlayButton 播放钮",
  component: PlayButton,
  args: { size: "md", disabled: false },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof PlayButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "三档尺寸",
  render: () => (
    <div className="flex items-end gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <PlayButton key={size} size={size} aria-label={`播放（${size}）`} />
      ))}
      <PlayButton disabled aria-label="播放（不可用）" />
    </div>
  ),
};

function Cover() {
  const [plays, setPlays] = useState(0);
  return (
    <div className="flex w-80 max-w-full flex-col gap-2">
      <div className="relative aspect-video overflow-clip rounded-md bg-surface-muted [&>svg]:size-full">
        <ScenePlaceholder seed={2} />
        <PlayButton
          size="lg"
          aria-label="播放：秋季勘探计划 · 预告"
          className="absolute bottom-3 left-3"
          onClick={() => setPlays(plays + 1)}
        />
      </div>
      <p role="status" className="font-tech text-xs text-ink-secondary">
        {plays === 0 ? "// 还没播放" : `// 点了 ${plays} 次`}
      </p>
    </div>
  );
}

export const OnCover: Story = {
  name: "压在封面上",
  render: () => <Cover />,
};

export const OnDarkCover: Story = {
  name: "压在深色的封面上",
  render: () => (
    <div className="relative aspect-video w-80 max-w-full overflow-clip rounded-md bg-surface-muted [&>svg]:size-full">
      <ScenePlaceholder seed={3} tone="dark" />
      <PlayButton
        size="lg"
        aria-label="播放：夜间值守"
        className="absolute bottom-3 left-3"
      />
    </div>
  ),
};

export const Mark: Story = {
  name: "只是记号（PlayMark）",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-6">
        <PlayMark size="sm" />
        <PlayMark />
        <PlayMark size="lg" />
      </div>
      <p className="max-w-sm text-sm text-ink-secondary">
        记号不能点，读屏也读不到。整张卡已经是一个链接时用它——媒体卡的{" "}
        <code className="font-tech">video</code> 就是这么做的。
      </p>
    </div>
  ),
};
