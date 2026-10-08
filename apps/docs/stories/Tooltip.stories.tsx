import {
  Button,
  ChevronLeft,
  ChevronRight,
  IconButton,
  Kbd,
  Lock,
  Minus,
  Plus,
  Tooltip,
  TooltipProvider,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Tooltip 文字提示",
  component: Tooltip,
  args: {
    content: "添加到编队",
    side: "top",
    align: "center",
    arrow: true,
    children: (
      <IconButton aria-label="添加">
        <Plus />
      </IconButton>
    ),
  },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "bottom", "left", "right"],
    },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sides: Story = {
  name: "四个方向",
  render: () => (
    <div className="grid grid-cols-2 gap-x-48 gap-y-16">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} content={`出现在 ${side}`} side={side} open>
          <Button variant="light" size="sm">
            {side}
          </Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const Toolbar: Story = {
  name: "工具栏：相邻的提示共用延迟",
  render: () => (
    // 第一个提示出现之后，移到旁边的按钮不用再等
    <TooltipProvider>
      <div className="flex gap-1">
        <Tooltip content="上一条">
          <IconButton aria-label="上一条">
            <ChevronLeft />
          </IconButton>
        </Tooltip>
        <Tooltip content="下一条">
          <IconButton aria-label="下一条">
            <ChevronRight />
          </IconButton>
        </Tooltip>
        <Tooltip content="缩小">
          <IconButton aria-label="缩小">
            <Minus />
          </IconButton>
        </Tooltip>
        <Tooltip content="放大">
          <IconButton aria-label="放大">
            <Plus />
          </IconButton>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const Supplementary: Story = {
  name: "补充说明",
  render: () => (
    <div className="flex flex-wrap items-center gap-8">
      {/* 内容和 aria-label 不同：作为补充说明关联给读屏 */}
      <Tooltip
        open
        content={
          <>
            锁定后不会被批量销毁 <Kbd size="sm">L</Kbd>
          </>
        }
      >
        <IconButton aria-label="锁定">
          <Lock />
        </IconButton>
      </Tooltip>
      <Tooltip
        open
        side="bottom"
        content="提示只放一句话。再长就该换成提示条，或者直接写在页面上——触屏上没有悬停，看不到它。"
      >
        <Button variant="text">一段很长的说明</Button>
      </Tooltip>
    </div>
  ),
};

export const NoArrow: Story = {
  name: "不带三角",
  args: { arrow: false, open: true, content: "紧贴触发元素" },
};
