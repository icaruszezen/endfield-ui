import {
  Button,
  ButtonGroup,
  HazardStripe,
  Panel,
  PanelBody,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "母题/HazardStripe 警示条纹",
  component: HazardStripe,
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HazardStripe>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "两档条高",
  render: () => (
    <div className="flex flex-col gap-4">
      <HazardStripe size="sm" />
      <HazardStripe />
    </div>
  ),
};

export const DangerZone: Story = {
  name: "危险操作区的顶边",
  render: () => (
    <Panel>
      <HazardStripe size="sm" />
      <PanelBody>
        <h3 className="font-medium">清空全部记录</h3>
        <p className="mt-1 text-sm text-ink-secondary">
          清空后无法恢复。条纹只是提醒，危险的含义写在这两行字里。
        </p>
        <ButtonGroup className="mt-4" aria-label="清空记录">
          <Button variant="light">取消</Button>
          <Button variant="danger">清空记录</Button>
        </ButtonGroup>
      </PanelBody>
    </Panel>
  ),
};
