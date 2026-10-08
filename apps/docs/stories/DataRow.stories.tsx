import { DataRow, DataRowList } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/* 虚构的一周收支。类目两种：结构件（紫）、耗材（青） */
const STRUCTURE = "var(--color-special)";
const CONSUMABLE = "var(--color-region)";

const ledger = [
  {
    id: "steel",
    name: "钢材",
    category: STRUCTURE,
    series: [42, 58, 51, 77, 69, 88, 80, 96],
    value: "+128",
    tone: "info",
    reference: "+140",
  },
  {
    id: "cable",
    name: "线缆",
    category: STRUCTURE,
    series: [64, 60, 71, 55, 62, 48, 57, 44],
    value: "−64",
    tone: "accent",
    reference: "−60",
  },
  {
    id: "filter",
    name: "滤芯",
    category: CONSUMABLE,
    series: [30, 52, 41, 66, 58, 83, 79, 97],
    value: "−212",
    tone: "danger",
    reference: "−180",
  },
] as const;

const columns = {
  name: "项目",
  trend: "走势",
  value: "当前",
  reference: "理论",
};

const meta = {
  title: "控件/DataRow 数据行带",
  component: DataRowList,
  parameters: { controls: { disable: true } },
  args: { columns, children: null },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataRowList>;

export default meta;
type Story = StoryObj<typeof meta>;

function Ledger({ initial = ["steel", "filter"] }: { initial?: string[] }) {
  const [favorites, setFavorites] = useState(initial);
  return (
    <DataRowList label="本周收支" columns={columns}>
      {ledger.map((row) => (
        <DataRow
          key={row.id}
          name={row.name}
          categoryColor={row.category}
          series={row.series}
          value={row.value}
          tone={row.tone}
          reference={row.reference}
          favorite={favorites.includes(row.id)}
          favoriteLabel={`收藏${row.name}`}
          onFavoriteChange={(next) =>
            setFavorites((current) =>
              next
                ? [...current, row.id]
                : current.filter((id) => id !== row.id),
            )
          }
        />
      ))}
    </DataRowList>
  );
}

export const Playground: Story = {
  name: "一周收支",
  render: () => <Ledger />,
};

export const Tones: Story = {
  name: "数字的四种含义",
  render: () => (
    <DataRowList label="含义" columns={{ name: "含义", value: "当前" }}>
      <DataRow name="产出、正向" value="+128" tone="info" />
      <DataRow name="消耗、关注" value="−64" tone="accent" />
      <DataRow name="超支、异常" value="−212" tone="danger" />
      <DataRow name="不表态" value="0" />
    </DataRowList>
  ),
};

export const StaticMark: Story = {
  name: "收藏只是标记、没有走势列",
  render: () => (
    <DataRowList
      label="库存"
      columns={{ name: "物资", value: "库存", reference: "上限" }}
    >
      <DataRow
        name="钢材"
        categoryColor={STRUCTURE}
        favorite
        value="1,280"
        reference="2,000"
      />
      <DataRow
        name="线缆"
        categoryColor={STRUCTURE}
        favorite={false}
        value="342"
        reference="500"
      />
      <DataRow
        name="滤芯"
        categoryColor={CONSUMABLE}
        favorite={false}
        value="18"
        tone="danger"
        reference="400"
      />
    </DataRowList>
  ),
};

export const Narrow: Story = {
  name: "容器变窄：先收走势，再收参考值",
  decorators: [],
  render: () => (
    <div className="flex flex-col gap-6">
      {["max-w-md", "max-w-xs"].map((width) => (
        <div key={width} className={width}>
          <Ledger />
        </div>
      ))}
      <div className="max-w-64">
        <DataRowList label="长名称" columns={columns}>
          <DataRow
            name="第三岩层备用冷却回路的滤芯"
            categoryColor={CONSUMABLE}
            favorite
            value="−1,212"
            tone="danger"
            reference="−180"
          />
        </DataRowList>
      </div>
    </div>
  ),
};
