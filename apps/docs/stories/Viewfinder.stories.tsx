import { Viewfinder } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScenePlaceholder } from "./_shared/Placeholders";

const meta = {
  title: "母题/Viewfinder 取景角",
  component: Viewfinder,
  args: { size: "sm", crosshair: false },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Viewfinder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    // 取景角的颜色跟的是画面，不是页面：这张占位图是浅色的，所以写 light
    <Viewfinder {...args} data-theme="light" className="max-w-md">
      <ScenePlaceholder className="block aspect-video w-full" />
    </Viewfinder>
  ),
};

export const WithReadouts: Story = {
  name: "准星与读数",
  render: () => (
    // 读数写的都是这张占位图的真实信息：画幅、比例、第几组轮廓
    <Viewfinder
      data-theme="light"
      crosshair
      size="md"
      className="max-w-md"
      readouts={{
        topLeft: "320 × 180",
        topRight: "16 : 9",
        bottomLeft: "SCENE 02 / 03",
      }}
    >
      <ScenePlaceholder seed={1} className="block aspect-video w-full" />
    </Viewfinder>
  ),
};

export const OnDarkImage: Story = {
  name: "压在深色画面上",
  render: () => (
    <Viewfinder
      data-theme="dark"
      crosshair
      className="max-w-md"
      readouts={{ bottomRight: "16 : 9" }}
    >
      <ScenePlaceholder
        seed={2}
        tone="dark"
        className="block aspect-video w-full"
      />
    </Viewfinder>
  ),
};
