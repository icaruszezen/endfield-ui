import { Calendar, Panel, type DateRange } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/* "今天"固定成 2026-10-09，预览不会随日期变 */
const TODAY = "2026-10-09";

const meta = {
  title: "控件/Calendar 月历",
  component: Calendar,
  args: { today: TODAY, weekStartsOn: 1, locale: "zh-CN" },
  argTypes: {
    weekStartsOn: { control: "inline-radio", options: [0, 1] },
    locale: { control: "inline-radio", options: ["zh-CN", "en-US", "ja-JP"] },
    value: { control: false },
    month: { control: false },
    isDateDisabled: { control: false },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Selected: Story = {
  name: "选中与今天",
  args: { defaultValue: "2026-10-15" },
};

/* 选中和今天可以是同一天：两个记号各管各的 */
export const SelectedToday: Story = {
  name: "选中的就是今天",
  args: { defaultValue: TODAY },
};

export const Range: Story = {
  name: "只能选一段日子",
  args: { min: "2026-10-05", max: "2026-10-23", defaultValue: "2026-10-12" },
};

/* 加 range：点两下选一段。两端是实心的块，中间是连着的浅带 */
export const PickRange: Story = {
  name: "选一段",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [value, setValue] = useState<DateRange | null>([
      "2026-10-07",
      "2026-10-15",
    ]);
    return (
      <div className="flex flex-col items-start gap-3">
        <Calendar range today={TODAY} value={value} onValueChange={setValue} />
        <p role="status" className="font-tech text-sm text-ink-secondary">
          {value === null ? "// 还没选" : `// ${value[0]} → ${value[1]}`}
        </p>
      </div>
    );
  },
};

/* 周末不可选：两端不能落在周末，但一段可以跨过去 */
export const PickRangeWeekdays: Story = {
  name: "选一段：跨过不可选的日子",
  parameters: { controls: { disable: true } },
  render: () => (
    <Calendar
      range
      today={TODAY}
      defaultValue={["2026-10-09", "2026-10-13"]}
      isDateDisabled={(date) =>
        [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay())
      }
    />
  ),
};

/* 周末不发车 */
export const Weekdays: Story = {
  name: "个别日子不可选",
  args: {
    isDateDisabled: (date: string) =>
      [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay()),
  },
};

export const Controlled: Story = {
  name: "受控",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [value, setValue] = useState<string | null>("2026-10-12");
    return (
      <div className="flex flex-col items-start gap-3">
        <Panel className="p-2">
          <Calendar today={TODAY} value={value} onValueChange={setValue} />
        </Panel>
        <p role="status" className="font-tech text-sm text-ink-secondary">
          {value ?? "还没选"}
        </p>
      </div>
    );
  },
};

export const Locale: Story = {
  name: "换语言，一周从星期日起",
  args: { locale: "en-US", weekStartsOn: 0, defaultValue: "2026-10-15" },
};
