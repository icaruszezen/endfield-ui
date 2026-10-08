import {
  ChevronLeft,
  ChevronRight,
  Close,
  IconButton,
  Plus,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/IconButton 图标按钮",
  component: IconButton,
  args: { "aria-label": "关闭", children: <Close /> },
  argTypes: {
    variant: {
      control: "select",
      options: ["plain", "floating", "accent", "inverse"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    children: { control: false },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: "变体",
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <IconButton aria-label="关闭" variant="plain">
        <Close />
      </IconButton>
      <IconButton aria-label="添加" variant="accent">
        <Plus />
      </IconButton>
      <IconButton aria-label="添加" variant="inverse">
        <Plus />
      </IconButton>
      <IconButton aria-label="下一页" variant="floating">
        <ChevronRight />
      </IconButton>
    </div>
  ),
};

export const Sizes: Story = {
  name: "尺寸",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["plain", "floating"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-4">
          {(["sm", "md", "lg"] as const).map((size) => (
            <IconButton
              key={size}
              aria-label="关闭"
              variant={variant}
              size={size}
            >
              <Close />
            </IconButton>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Pressed: Story = {
  name: "开关：激活态",
  render: function PressedStory() {
    const [accent, setAccent] = useState(true);
    const [inverse, setInverse] = useState(true);
    const [plain, setPlain] = useState(true);
    return (
      <div className="flex items-center gap-4">
        <IconButton
          aria-label="收藏"
          variant="plain"
          pressed={plain}
          onClick={() => setPlain((value) => !value)}
        >
          <Plus />
        </IconButton>
        <IconButton
          aria-label="收藏"
          variant="accent"
          pressed={accent}
          onClick={() => setAccent((value) => !value)}
        >
          <Plus />
        </IconButton>
        <IconButton
          aria-label="收藏"
          variant="inverse"
          pressed={inverse}
          onClick={() => setInverse((value) => !value)}
        >
          <Plus />
        </IconButton>
      </div>
    );
  },
};

export const Disabled: Story = {
  name: "禁用",
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton aria-label="关闭" disabled>
        <Close />
      </IconButton>
      <IconButton aria-label="添加" variant="accent" disabled>
        <Plus />
      </IconButton>
      <IconButton aria-label="上一页" variant="floating" disabled>
        <ChevronLeft />
      </IconButton>
    </div>
  ),
};

export const PagerPair: Story = {
  name: "成对的翻页钮",
  render: () => (
    <div className="inline-flex items-center gap-2 rounded-full bg-surface-muted p-1.5">
      <IconButton aria-label="上一个" variant="floating" disabled>
        <ChevronLeft />
      </IconButton>
      <span className="px-2 font-tech text-sm text-ink tabular-nums">
        1 / 4
      </span>
      <IconButton aria-label="下一个" variant="floating">
        <ChevronRight />
      </IconButton>
    </div>
  ),
};
