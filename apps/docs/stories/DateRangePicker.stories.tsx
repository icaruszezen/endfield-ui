import {
  Button,
  DateRangePicker,
  Field,
  type DateRange,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/* "今天"固定成 2026-10-09，预览不会随日期变。文案全部虚构 */
const TODAY = "2026-10-09";
const DAY = 86_400_000;

const days = ([start, end]: DateRange) =>
  Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1;

const weekend = (date: string) =>
  [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());

const meta = {
  title: "控件/DateRangePicker 日期范围",
  component: DateRangePicker,
  args: {
    "aria-label": "发车日期",
    today: TODAY,
    variant: "sunken",
    size: "md",
    disabled: false,
    required: false,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["sunken", "outline"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    value: { control: false },
    defaultValue: { control: false },
    format: { control: false },
    isDateDisabled: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InField: Story = {
  name: "放进字段",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [range, setRange] = useState<DateRange | null>(null);
    return (
      <Field
        label="发车日期"
        help={
          range === null
            ? "点两下：先起始日，再结束日。两头都算。"
            : `已选 ${range[0]} 到 ${range[1]}，共 ${days(range)} 天。`
        }
      >
        <DateRangePicker today={TODAY} value={range} onValueChange={setRange} />
      </Field>
    );
  },
};

/* 周末不发车：两端不能落在周末，但一段可以跨过周末 */
export const Weekdays: Story = {
  name: "个别日子不可选，范围有限",
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="发车日期" help="只能选十月里的工作日；可以跨过周末。">
      <DateRangePicker
        today={TODAY}
        min="2026-10-01"
        max="2026-10-31"
        isDateDisabled={weekend}
        defaultValue={["2026-10-09", "2026-10-13"]}
      />
    </Field>
  ),
};

export const Sizes: Story = {
  name: "尺寸与两种外框",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      <DateRangePicker
        aria-label="小"
        size="sm"
        today={TODAY}
        defaultValue={["2026-10-03", "2026-10-12"]}
      />
      <DateRangePicker
        aria-label="中"
        today={TODAY}
        defaultValue={["2026-10-03", "2026-10-12"]}
      />
      <DateRangePicker
        aria-label="大"
        size="lg"
        today={TODAY}
        defaultValue={["2026-10-03", "2026-10-12"]}
      />
      <div className="bg-surface-sunken p-4">
        <DateRangePicker
          aria-label="描边"
          variant="outline"
          today={TODAY}
          placeholder="放在凹陷底色里时用描边"
        />
      </div>
    </div>
  ),
};

export const States: Story = {
  name: "错误、必填与禁用",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Field label="检修窗口" error="这一段里有已经排满的日子，换一段。">
        <DateRangePicker
          today={TODAY}
          defaultValue={["2026-10-12", "2026-10-14"]}
        />
      </Field>
      <Field label="验收窗口" required help="必填的字段，面板里没有“清除”。">
        <DateRangePicker
          today={TODAY}
          defaultValue={["2026-10-20", "2026-10-22"]}
        />
      </Field>
      <Field label="归档窗口" disabled>
        <DateRangePicker
          today={TODAY}
          defaultValue={["2026-09-28", "2026-09-30"]}
        />
      </Field>
    </div>
  ),
};

/* 起止两天各一个表单字段，写法是 YYYY-MM-DD */
export const InForm: Story = {
  name: "随表单提交",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [sent, setSent] = useState("还没提交");
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSent(`from=${data.get("from")}&to=${data.get("to")}`);
        }}
      >
        <Field label="发车日期">
          <DateRangePicker
            today={TODAY}
            startName="from"
            endName="to"
            defaultValue={["2026-10-12", "2026-10-16"]}
          />
        </Field>
        <Button type="submit" className="self-start">
          提交
        </Button>
        <p role="status" className="font-tech text-sm text-ink-secondary">
          {sent}
        </p>
      </form>
    );
  },
};

export const SingleDay: Story = {
  name: "起止是同一天",
  args: { defaultValue: ["2026-10-09", "2026-10-09"] },
};

export const CustomFormat: Story = {
  name: "换一种写法",
  args: {
    defaultValue: ["2026-10-03", "2026-10-12"],
    format: (date: string) =>
      `${Number(date.slice(5, 7))} 月 ${Number(date.slice(8))} 日`,
  },
};

/* 默认打开，供截图核对。不进文档页，也不并排 */
export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { defaultOpen: true, defaultValue: ["2026-10-07", "2026-10-15"] },
};
