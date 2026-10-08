import { RegistrationStrip } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "母题/RegistrationStrip 注册色条",
  component: RegistrationStrip,
  args: { orientation: "horizontal", rule: false },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof RegistrationStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Orientations: Story = {
  name: "横条与竖条",
  render: () => (
    <div className="flex items-center gap-10">
      <RegistrationStrip />
      <RegistrationStrip orientation="vertical" />
    </div>
  ),
};

export const UnderName: Story = {
  name: "名称下方的分隔线",
  render: () => (
    <div className="max-w-md">
      <h3 className="flex items-baseline gap-[0.4em] text-3xl">
        <span aria-hidden="true" className="font-medium text-ink-tertiary">
          [
        </span>
        <span className="font-bold">北区仓储站</span>
        <span aria-hidden="true" className="font-medium text-ink-tertiary">
          ]
        </span>
      </h3>
      <RegistrationStrip rule className="mt-3" />
      <p className="mt-3 text-sm text-ink-secondary">
        色条是签名：小、少、固定位置。一个版块最多一处。
      </p>
    </div>
  ),
};

export const BesideLabels: Story = {
  name: "标签组的末尾",
  render: () => (
    <div className="flex items-center gap-3">
      <div className="font-latin text-xs leading-tight text-ink-secondary uppercase">
        <p>Endfield-UI</p>
        <p>Section 03 of 05</p>
      </div>
      <RegistrationStrip orientation="vertical" />
    </div>
  ),
};
