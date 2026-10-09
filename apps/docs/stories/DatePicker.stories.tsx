import { Button, DatePicker, Field } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/* "今天"固定成 2026-10-09，预览不会随日期变。文案全部虚构 */
const TODAY = "2026-10-09";

const meta = {
  title: "控件/DatePicker 日期选择",
  component: DatePicker,
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
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InField: Story = {
  name: "放进字段",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [date, setDate] = useState<string | null>(null);
    return (
      <Field
        label="发车日期"
        help={
          date === null
            ? "只能选今天起三周之内的工作日。"
            : `已选 ${date}，值就是这个写法。`
        }
      >
        <DatePicker
          today={TODAY}
          value={date}
          onValueChange={setDate}
          min={TODAY}
          max="2026-10-30"
          isDateDisabled={(day) =>
            [0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())
          }
        />
      </Field>
    );
  },
};

/*
 * 起止各是一个字段：并排两个，后一个的 min 是前一个的值。
 * 要在一个字段里选一段，用 DateRangePicker
 */
export const StartAndEnd: Story = {
  name: "起止日期",
  parameters: { controls: { disable: true } },
  decorators: [
    (Story) => (
      <div className="w-[36rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  render: function Render() {
    const [start, setStart] = useState<string | null>("2026-10-12");
    const [end, setEnd] = useState<string | null>("2026-10-16");
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="从">
          <DatePicker
            today={TODAY}
            value={start}
            onValueChange={(next) => {
              setStart(next);
              // 起点挪到了终点后面：终点跟过去
              if (next !== null && end !== null && end < next) setEnd(next);
            }}
          />
        </Field>
        <Field label="到">
          <DatePicker
            today={TODAY}
            value={end}
            onValueChange={setEnd}
            min={start ?? undefined}
          />
        </Field>
      </div>
    );
  },
};

export const Sizes: Story = {
  name: "尺寸与两种外框",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      <DatePicker
        aria-label="小"
        size="sm"
        today={TODAY}
        defaultValue="2026-10-09"
      />
      <DatePicker aria-label="中" today={TODAY} defaultValue="2026-10-09" />
      <DatePicker
        aria-label="大"
        size="lg"
        today={TODAY}
        defaultValue="2026-10-09"
      />
      <div className="bg-surface-sunken p-4">
        <DatePicker
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
      <Field label="到站日期" error="这一天这个站不收货，换一天。">
        <DatePicker today={TODAY} defaultValue="2026-10-11" />
      </Field>
      <Field label="验收日期" required help="必填的字段，面板里没有“清除”。">
        <DatePicker today={TODAY} defaultValue="2026-10-14" />
      </Field>
      <Field label="归档日期" disabled>
        <DatePicker today={TODAY} defaultValue="2026-09-30" />
      </Field>
    </div>
  ),
};

/* 值随表单提交，写法是 YYYY-MM-DD */
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
          setSent(String(new FormData(event.currentTarget).get("depart")));
        }}
      >
        <Field label="发车日期">
          <DatePicker today={TODAY} name="depart" defaultValue="2026-10-12" />
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

export const CustomFormat: Story = {
  name: "换一种写法",
  args: {
    defaultValue: "2026-10-09",
    format: (date: string) =>
      new Intl.DateTimeFormat("zh-CN", {
        timeZone: "UTC",
        dateStyle: "full",
      }).format(new Date(`${date}T00:00:00Z`)),
  },
};

/* 默认打开，供截图核对。不进文档页，也不并排 */
export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { defaultOpen: true, defaultValue: "2026-10-15" },
};
