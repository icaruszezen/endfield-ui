import { FilterChip } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/FilterChip 筛选胶囊",
  component: FilterChip,
  args: { children: "新闻" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    selected: { control: false },
  },
} satisfies Meta<typeof FilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const categories = ["新闻", "公告", "维护", "活动", "影像"];

function Filters() {
  const [selected, setSelected] = useState<string[]>(["新闻", "维护"]);
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="情报类目" className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <FilterChip
            key={category}
            selected={selected.includes(category)}
            onSelectedChange={(on) =>
              setSelected((current) =>
                on
                  ? [...current, category]
                  : current.filter((item) => item !== category),
              )
            }
          >
            {category}
          </FilterChip>
        ))}
      </div>
      <p className="font-tech text-xs text-ink-secondary">
        {`// 已选 ${selected.length} 项`}
      </p>
    </div>
  );
}

export const Multiple: Story = {
  name: "多选筛选",
  render: () => <Filters />,
};

export const States: Story = {
  name: "状态与尺寸",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-2">
          <FilterChip size={size}>未选</FilterChip>
          <FilterChip size={size} defaultSelected>
            已选
          </FilterChip>
          <FilterChip size={size} disabled>
            禁用
          </FilterChip>
          <FilterChip size={size} disabled defaultSelected>
            已选且禁用
          </FilterChip>
        </div>
      ))}
    </div>
  ),
};
