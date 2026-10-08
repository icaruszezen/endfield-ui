import { ResourceChip } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateIcon, FuelIcon, OreIcon } from "./_shared/ResourceIcons";

const meta = {
  title: "控件/ResourceChip 资源胶囊",
  component: ResourceChip,
  args: { children: "1,280", icon: <FuelIcon />, label: "燃料 1,280" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    icon: { control: false },
  },
} satisfies Meta<typeof ResourceChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸与有无图标",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ResourceChip icon={<FuelIcon />} label="燃料 1,280">
          1,280
        </ResourceChip>
        <ResourceChip icon={<OreIcon />} label="矿样 64">
          64
        </ResourceChip>
        <ResourceChip icon={<CrateIcon />} label="补给箱 7">
          7
        </ResourceChip>
        <ResourceChip>12,480</ResourceChip>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ResourceChip size="sm" icon={<FuelIcon />} label="燃料 1,280">
          1,280
        </ResourceChip>
        <ResourceChip size="sm" icon={<OreIcon />} label="矿样 64">
          64
        </ResourceChip>
        <ResourceChip size="sm">12,480</ResourceChip>
      </div>
    </div>
  ),
};
