import { CornerBrackets } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "母题/CornerBrackets 角括号",
  component: CornerBrackets,
  args: { visible: true, size: "sm" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof CornerBrackets>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <CornerBrackets {...args} className="inline-block">
      <div className="flex size-24 items-center justify-center border border-line bg-surface-raised text-sm text-ink-secondary">
        条目
      </div>
    </CornerBrackets>
  ),
};

export const Sizes: Story = {
  name: "两档臂长",
  render: () => (
    <div className="flex items-end gap-8 p-2">
      <CornerBrackets>
        <div className="size-16 border border-line bg-surface-raised" />
      </CornerBrackets>
      <CornerBrackets size="md">
        <div className="size-28 border border-line bg-surface-raised" />
      </CornerBrackets>
    </div>
  ),
};

function Matrix() {
  const [selected, setSelected] = useState(2);
  return (
    <div className="grid w-fit grid-cols-4 gap-2 p-2">
      {Array.from({ length: 8 }, (_, index) => (
        <CornerBrackets key={index} visible={selected === index}>
          <button
            type="button"
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
            className="flex size-16 items-center justify-center border border-line bg-surface-raised font-tech text-sm text-ink-secondary hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-focus"
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        </CornerBrackets>
      ))}
    </div>
  );
}

export const Selection: Story = {
  name: "矩阵里的单选",
  render: () => <Matrix />,
};
