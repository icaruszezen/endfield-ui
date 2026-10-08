import { FlyoutBar, FlyoutBarItem, IconButton } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  CodeGridIcon,
  LinkIcon,
  MailIcon,
  PrintIcon,
  ShareIcon,
} from "./_shared/ResourceIcons";

/* 分享的几个去处。图标都是原创的几何图形，不用任何平台的标志 */
const targets = (
  <>
    <FlyoutBarItem aria-label="复制链接">
      <LinkIcon />
    </FlyoutBarItem>
    <FlyoutBarItem aria-label="显示二维码">
      <CodeGridIcon />
    </FlyoutBarItem>
    <FlyoutBarItem aria-label="发邮件" href="mailto:?subject=endfield-ui">
      <MailIcon />
    </FlyoutBarItem>
    <FlyoutBarItem aria-label="打印" disabled>
      <PrintIcon />
    </FlyoutBarItem>
  </>
);

const meta = {
  title: "控件/FlyoutBar 展开条",
  component: FlyoutBar,
  args: {
    side: "right",
    trigger: (
      <IconButton variant="inverse" aria-label="分享">
        <ShareIcon />
      </IconButton>
    ),
    children: targets,
  },
  argTypes: {
    side: { control: "inline-radio", options: ["right", "left"] },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof FlyoutBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LeftSide: Story = {
  name: "靠右边缘时向左展开",
  render: (args) => (
    <div className="flex justify-end">
      <FlyoutBar {...args} side="left" />
    </div>
  ),
};

export const WithText: Story = {
  name: "带文字的项",
  args: {
    children: (
      <>
        <FlyoutBarItem>
          <LinkIcon />
          复制链接
        </FlyoutBarItem>
        <FlyoutBarItem>
          <PrintIcon />
          打印
        </FlyoutBarItem>
      </>
    ),
  },
};

export const Heights: Story = {
  name: "高度跟着触发按钮",
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <FlyoutBar
          key={size}
          {...args}
          trigger={
            <IconButton variant="inverse" size={size} aria-label="分享">
              <ShareIcon />
            </IconButton>
          }
        />
      ))}
    </div>
  ),
};

export const Feedback: Story = {
  name: "点了之后",
  render: function Render(args) {
    const [last, setLast] = useState("还没有分享过");
    return (
      <div className="flex flex-col items-start gap-4">
        <FlyoutBar {...args}>
          <FlyoutBarItem
            aria-label="复制链接"
            onClick={() => setLast("已复制链接")}
          >
            <LinkIcon />
          </FlyoutBarItem>
          <FlyoutBarItem
            aria-label="显示二维码"
            onClick={() => setLast("已显示二维码")}
          >
            <CodeGridIcon />
          </FlyoutBarItem>
        </FlyoutBar>
        <p role="status" className="text-sm text-ink-secondary">
          {last}
        </p>
      </div>
    );
  },
};

/* 默认打开，供截图核对。不进文档页；开着的时候页面其余部分不可交互，所以也不并排 */
export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { defaultOpen: true },
};
