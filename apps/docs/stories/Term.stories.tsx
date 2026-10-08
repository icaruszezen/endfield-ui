import { Panel, PanelBody, PanelHeader, Term } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FuelIcon, OreIcon } from "./_shared/ResourceIcons";

const meta = {
  title: "控件/Term 语义着色词",
  component: Term,
  args: { children: "120%", tone: "accent" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["accent", "info", "success", "warning", "danger"],
    },
  },
} satisfies Meta<typeof Term>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <p className="max-w-md">
      对范围内的目标造成 <Term {...args} /> 的伤害。
    </p>
  ),
};

export const Tones: Story = {
  name: "五种色调",
  render: () => (
    <ul className="grid max-w-md gap-2 text-sm">
      <li>
        <Term>accent</Term>　数值与一般的强调
      </li>
      <li>
        <Term tone="info">info</Term>　中性的机制
      </li>
      <li>
        <Term tone="success">success</Term>　增益、恢复
      </li>
      <li>
        <Term tone="warning">warning</Term>　消耗、代价
      </li>
      <li>
        <Term tone="danger">danger</Term>　伤害、减益
      </li>
    </ul>
  ),
};

export const InParagraph: Story = {
  name: "技能描述",
  render: () => (
    <Panel className="max-w-md">
      <PanelHeader>过载脉冲</PanelHeader>
      <PanelBody className="text-sm leading-relaxed">
        <p>
          消耗{" "}
          <Term tone="warning" icon={<FuelIcon />}>
            燃料 30
          </Term>
          ，对前方目标造成 <Term>180%</Term> 的伤害，并施加{" "}
          <Term tone="danger">灼烧</Term>。
        </p>
        <p className="mt-2">
          目标已处于 <Term tone="info">冻结</Term> 时，改为回收{" "}
          <Term tone="success" icon={<OreIcon />}>
            矿石 12
          </Term>
          。
        </p>
        <p className="mt-4 text-xs text-ink-secondary">
          这里的对应是：黄 = 数值，橙 = 消耗，红 = 减益，蓝 = 机制，绿 =
          获得。同一个产品里只用这一张表。
        </p>
      </PanelBody>
    </Panel>
  ),
};
