import { ItemGrid, ItemSlot, Kbd } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { CrateIcon, FuelIcon, OreIcon } from "./_shared/ResourceIcons";

const meta = {
  title: "控件/ItemSlot 物品格",
  component: ItemSlot,
  args: { name: "合金锭", count: 128, rarity: 2 },
  argTypes: {
    rarity: { control: "inline-radio", options: [undefined, 1, 2, 3, 4] },
    ratio: { control: "inline-radio", options: ["1/1", "4/5"] },
  },
} satisfies Meta<typeof ItemSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

// 角括号画在格子之外 4px：网格四周留出这段空隙
const grid = "grid w-fit grid-cols-[repeat(4,4.5rem)] gap-2 p-1";

export const Playground: Story = {
  render: (args) => (
    <div className="w-18 p-1">
      <ItemSlot {...args}>
        <OreIcon size={32} />
      </ItemSlot>
    </div>
  ),
};

export const Rarities: Story = {
  name: "稀有度",
  render: () => (
    <div className={grid}>
      <ItemSlot name="碎石" count={999} rarity={1}>
        <OreIcon size={32} />
      </ItemSlot>
      <ItemSlot name="合金锭" count={128} rarity={2}>
        <OreIcon size={32} />
      </ItemSlot>
      <ItemSlot name="高能燃料" count={36} rarity={3}>
        <FuelIcon size={32} />
      </ItemSlot>
      <ItemSlot name="密封货箱" count={2} rarity={4}>
        <CrateIcon size={32} />
      </ItemSlot>
    </div>
  ),
};

export const States: Story = {
  name: "状态",
  render: () => (
    <div className="grid w-fit grid-cols-[repeat(4,4.5rem)] gap-x-2 gap-y-1 p-1">
      {(
        [
          ["默认", {}],
          ["选中", { selected: true }],
          ["锁定", { locked: true }],
          ["未获得", { unowned: true, count: undefined, rarity: undefined }],
          ["新获得", { isNew: true }],
          ["已装备", { badge: "甲" }],
          ["售罄", { unavailable: "售罄" }],
          ["不可用", { unavailable: true }],
        ] as const
      ).map(([caption, props]) => (
        <figure key={caption}>
          <ItemSlot name="合金锭" count={12} rarity={2} {...props}>
            <OreIcon size={32} />
          </ItemSlot>
          <figcaption className="mt-1.5 mb-2 text-center text-xs text-ink-secondary">
            {caption}
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};

const inventory = [
  { name: "碎石", count: 999, rarity: 1, icon: OreIcon },
  { name: "合金锭", count: 128, rarity: 2, icon: OreIcon },
  { name: "高能燃料", count: 36, rarity: 3, icon: FuelIcon, isNew: true },
  { name: "密封货箱", count: 2, rarity: 4, icon: CrateIcon, locked: true },
  { name: "滤芯", count: 14, rarity: 1, icon: CrateIcon },
  { name: "备用电池", count: 8, rarity: 2, icon: FuelIcon },
  { name: "定位信标", count: 1, rarity: 3, icon: FuelIcon },
  { name: "未登记的样本", rarity: undefined, icon: OreIcon, unowned: true },
] as const;

function Inventory() {
  const [selected, setSelected] = useState("合金锭");
  return (
    <div className="flex flex-col gap-3">
      <div className={grid}>
        {inventory.map(({ icon: Icon, ...item }) => (
          <ItemSlot
            key={item.name}
            {...item}
            selected={selected === item.name}
            onClick={() => setSelected(item.name)}
          >
            <Icon size={32} />
          </ItemSlot>
        ))}
      </div>
      <p className="font-tech text-xs text-ink-secondary">{`// ${selected}`}</p>
    </div>
  );
}

export const Selectable: Story = {
  name: "矩阵里的单选",
  render: () => <Inventory />,
};

const matrix = [
  { name: "碎石", count: 999, rarity: 1, icon: OreIcon },
  { name: "滤芯", count: 14, rarity: 1, icon: CrateIcon },
  { name: "绝缘胶带", count: 60, rarity: 1, icon: CrateIcon },
  { name: "合金锭", count: 128, rarity: 2, icon: OreIcon },
  { name: "备用电池", count: 8, rarity: 2, icon: FuelIcon },
  { name: "冷却液", count: 40, rarity: 2, icon: FuelIcon },
  { name: "应急口粮", count: 25, rarity: 2, icon: CrateIcon },
  { name: "高能燃料", count: 36, rarity: 3, icon: FuelIcon },
  { name: "定位信标", count: 1, rarity: 3, icon: FuelIcon },
  { name: "加固板材", count: 22, rarity: 3, icon: CrateIcon },
  { name: "信号中继器", count: 3, rarity: 3, icon: OreIcon },
  { name: "密封货箱", count: 2, rarity: 4, icon: CrateIcon },
  { name: "校准核心", count: 1, rarity: 4, icon: OreIcon },
  { name: "测绘底图", count: 5, rarity: 4, icon: CrateIcon },
] as const;

function Matrix() {
  const [selected, setSelected] = useState("合金锭");
  return (
    <div className="flex max-w-md flex-col gap-3">
      <ItemGrid aria-label="物资">
        {matrix.map(({ icon: Icon, ...item }) => (
          <ItemSlot
            key={item.name}
            {...item}
            selected={selected === item.name}
            onClick={() => setSelected(item.name)}
          >
            <Icon size={32} />
          </ItemSlot>
        ))}
        {/* 不可用的格子和静态的格子方向键走不到 */}
        <ItemSlot
          name="过期试剂"
          count={4}
          rarity={1}
          unavailable
          disabled
          onClick={() => {}}
        >
          <FuelIcon size={32} />
        </ItemSlot>
        <ItemSlot name="未登记的样本" unowned />
      </ItemGrid>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-secondary">
        <Kbd>←</Kbd>
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        <Kbd>→</Kbd>
        移动
        <Kbd>Enter</Kbd>
        选中
        <span className="font-tech">{`// ${selected}`}</span>
      </p>
    </div>
  );
}

/* 整个矩阵只占一个 Tab 停靠点，进去之后用方向键走 */
export const Grid: Story = {
  name: "矩阵：方向键移动",
  render: () => <Matrix />,
};

export const Portrait: Story = {
  name: "4:5 的格子",
  render: () => (
    <div className="grid w-fit grid-cols-[repeat(3,5.5rem)] gap-2 p-1">
      <ItemSlot name="合金锭" ratio="4/5" count={128} rarity={2}>
        <OreIcon size={40} />
      </ItemSlot>
      <ItemSlot name="高能燃料" ratio="4/5" count={36} rarity={3} selected>
        <FuelIcon size={40} />
      </ItemSlot>
      <ItemSlot name="密封货箱" ratio="4/5" count={2} rarity={4} isNew>
        <CrateIcon size={40} />
      </ItemSlot>
    </div>
  ),
};
