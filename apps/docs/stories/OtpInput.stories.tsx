import { Button, Field, OtpInput } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/* 文案全部虚构 */
const meta = {
  title: "控件/OtpInput 验证码输入",
  component: OtpInput,
  args: {
    "aria-label": "交接口令",
    length: 6,
    type: "numeric",
    size: "md",
    variant: "sunken",
    uppercase: false,
    mask: false,
    invalid: false,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    type: { control: "inline-radio", options: ["numeric", "alphanumeric"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["sunken", "outline"] },
    groupSize: { control: { type: "number", min: 0, max: 6 } },
    slotLabel: { control: false },
  },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { name: "试一试" };

export const Sizes: Story = {
  name: "三档尺寸",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <OtpInput aria-label="小号" size="sm" defaultValue="204" />
      <OtpInput aria-label="中号" size="md" defaultValue="204" />
      <OtpInput aria-label="大号" size="lg" defaultValue="204" />
    </div>
  ),
};

/* 六位的码分成三位一组，好念、好对。短横只是画的 */
export const Grouped: Story = {
  name: "三位一组",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <OtpInput aria-label="交接口令" groupSize={3} defaultValue="204157" />
      <OtpInput
        aria-label="批次校验码"
        length={8}
        groupSize={4}
        size="sm"
        defaultValue="2041"
      />
    </div>
  ),
};

/* 字母加数字，统一成大写：值也是大写，不只是看起来 */
export const Alphanumeric: Story = {
  name: "字母加数字",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [value, setValue] = useState("n7");
    return (
      <div className="flex flex-col items-start gap-3">
        <OtpInput
          aria-label="站点编号"
          length={5}
          type="alphanumeric"
          uppercase
          value={value}
          onValueChange={setValue}
        />
        <p role="status" className="font-tech text-sm text-ink-secondary">
          {`// 值：${value || "（空）"}`}
        </p>
      </div>
    );
  },
};

export const Masked: Story = {
  name: "遮起来",
  parameters: { controls: { disable: true } },
  render: () => (
    <OtpInput aria-label="终端口令" length={4} mask defaultValue="20" />
  ),
};

/* 放进 Field：标签、帮助、错误自动关联。填满时核对，不对就亮错误态 */
function InFieldExample() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [sent, setSent] = useState<string | null>(null);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSent(String(new FormData(event.currentTarget).get("code") ?? ""));
      }}
      className="flex max-w-sm flex-col items-start gap-4"
    >
      <Field
        label="交接口令"
        help="六位数字，在交接单的右上角。演示里对的是 204157。"
        error={state === "wrong" ? "口令不对，再核对一遍交接单。" : undefined}
        required
      >
        <OtpInput
          name="code"
          groupSize={3}
          value={code}
          onValueChange={(next) => {
            setCode(next);
            setState("idle");
          }}
          onComplete={(value) =>
            setState(value === "204157" ? "right" : "wrong")
          }
        />
      </Field>
      <Button type="submit" variant="action" disabled={state !== "right"}>
        确认交接
      </Button>
      <p role="status" className="font-tech text-sm text-ink-secondary">
        {sent === null ? "// 还没有提交" : `// 提交的是 ${sent}`}
      </p>
    </form>
  );
}

export const InField: Story = {
  name: "放进字段",
  parameters: { controls: { disable: true } },
  render: () => <InFieldExample />,
};

/* 凹陷底色的区域里换成四边描边，同输入框 */
export const Outline: Story = {
  name: "描边",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="bg-surface-sunken p-4">
      <Field label="交接口令">
        <OtpInput variant="outline" groupSize={3} defaultValue="204" />
      </Field>
    </div>
  ),
};

export const States: Story = {
  name: "状态",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <Field label="错误" error="口令不对，再核对一遍交接单。">
        <OtpInput defaultValue="204158" />
      </Field>
      <Field label="禁用" disabled>
        <OtpInput defaultValue="204" />
      </Field>
      <Field label="只读">
        <OtpInput readOnly defaultValue="204157" />
      </Field>
    </div>
  ),
};

/* 容器窄了格子等比变窄，高度不变，不换行也不溢出 */
export const Narrow: Story = {
  name: "窄容器里格子变窄",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <Field label="交接口令">
        <OtpInput size="lg" groupSize={3} defaultValue="2041" />
      </Field>
    </div>
  ),
};
