import { Button, Field, Input, TagInput } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type FormEvent } from "react";

/* 文案全部虚构 */
const meta = {
  title: "控件/TagInput 标签输入",
  component: TagInput,
  args: {
    "aria-label": "站点标签",
    placeholder: "输入后按回车",
    defaultValue: ["北岭", "管廊"],
    size: "md",
    variant: "sunken",
    commitOnBlur: true,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["sunken", "outline"] },
    value: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "三档尺寸",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <TagInput
          key={size}
          aria-label={`关键词（${size}）`}
          size={size}
          defaultValue={["测绘", "信标"]}
          placeholder="输入后按回车"
        />
      ))}
    </div>
  ),
};

function LimitExample() {
  const [note, setNote] = useState("还没有被拒绝的");
  return (
    <div className="flex flex-col gap-3">
      <TagInput
        aria-label="巡检关键词"
        max={4}
        defaultValue={["滤芯", "电池"]}
        placeholder="最多四个"
        onReject={(text, reason) => setNote(`${text}：${reason}`)}
      />
      <p role="status" className="font-tech text-xs text-ink-secondary">
        {`// ${note}`}
      </p>
    </div>
  );
}

/* 已经有了的闪一下、字留着；到了上限右端的计数是满的 */
export const Limit: Story = {
  name: "上限与重复",
  render: () => <LimitExample />,
};

function ValidateExample() {
  const [error, setError] = useState<string>();
  return (
    <Field label="联络代号" help="每个代号两到六个字母或数字。" error={error}>
      <TagInput
        defaultValue={["N7"]}
        placeholder="例如 N7"
        validate={(text) =>
          /^[A-Za-z0-9]{2,6}$/.test(text)
            ? null
            : `"${text}"不是两到六个字母或数字，改一下再按回车。`
        }
        onReject={(_, reason, message) =>
          setError(reason === "invalid" ? message : undefined)
        }
        onValueChange={() => setError(undefined)}
      />
    </Field>
  );
}

/* validate 返回一句话就是不让加：这句话由使用方放进字段的错误说明 */
export const Validate: Story = {
  name: "自己把关",
  render: () => <ValidateExample />,
};

function InFieldExample() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitted(
      `name=${data.get("name")}&tags=${data.getAll("tags").join("|")}`,
    );
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="站点名称">
        <Input name="name" defaultValue="北区七号站" />
      </Field>
      <Field label="站点标签" help="回车或逗号分开，最多八个。粘贴一串也行。">
        <TagInput
          name="tags"
          max={8}
          defaultValue={["北岭", "管廊"]}
          placeholder="输入后按回车"
        />
      </Field>
      <div className="flex items-center gap-4">
        <Button type="submit">保存</Button>
        <output className="font-tech text-xs text-ink-secondary">
          {submitted ?? "// 还没提交"}
        </output>
      </div>
    </form>
  );
}

export const InField: Story = {
  name: "放进字段，随表单提交",
  render: () => <InFieldExample />,
};

export const Outline: Story = {
  name: "描边（放在凹陷底色的区域里）",
  render: () => (
    <div className="bg-surface-sunken p-4">
      <Field label="筛选关键词">
        <TagInput
          variant="outline"
          defaultValue={["延误"]}
          placeholder="输入后按回车"
        />
      </Field>
    </div>
  ),
};

export const States: Story = {
  name: "状态：空的、错误、禁用、只读",
  render: () => (
    <div className="flex flex-col gap-4">
      <TagInput aria-label="空的" placeholder="输入后按回车" />
      <TagInput aria-label="错误" invalid defaultValue={["北岭"]} max={4} />
      <TagInput aria-label="禁用" disabled defaultValue={["北岭", "管廊"]} />
      <TagInput aria-label="只读" readOnly defaultValue={["北岭", "管廊"]} />
    </div>
  ),
};

/* 小块放不下就换行，外框跟着长高；很长的一个词在小块里截断 */
export const Narrow: Story = {
  name: "窄容器里换行",
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <TagInput
        aria-label="站点标签"
        max={8}
        defaultValue={[
          "北岭",
          "输料管廊",
          "二号线",
          "第七勘探区的首批测绘数据已归档",
        ]}
      />
    </div>
  ),
};
