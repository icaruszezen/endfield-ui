import {
  Field,
  Select,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  type SelectSingleProps,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentType } from "react";

const regions = [
  { value: "valley", label: "四号谷地" },
  { value: "ridge", label: "北岭" },
  { value: "basin", label: "盐湖盆地" },
  { value: "delta", label: "三角洲（未开放）", disabled: true },
];

const meta = {
  title: "控件/Select 下拉选择",
  // Select 的属性是单选、多选两支的联合；控件面板按单选那一支来
  component: Select as ComponentType<SelectSingleProps>,
  args: {
    items: regions,
    placeholder: "请选择",
    "aria-label": "地区",
    variant: "sunken",
    size: "md",
    panelVariant: "plain",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["sunken", "outline"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    panelVariant: { control: "inline-radio", options: ["plain", "strong"] },
    items: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<SelectSingleProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸与两种外框",
  render: () => (
    <div className="flex flex-col gap-4">
      <Select items={regions} size="sm" aria-label="小" defaultValue="valley" />
      <Select items={regions} size="md" aria-label="中" defaultValue="ridge" />
      <Select items={regions} size="lg" aria-label="大" defaultValue="basin" />
      {/* 四边描边的那种放在凹陷底色的区域里 */}
      <div className="bg-surface-sunken p-3">
        <Select
          items={regions}
          variant="outline"
          aria-label="描边"
          placeholder="outline"
        />
      </div>
    </div>
  ),
};

export const InField: Story = {
  name: "放进字段",
  render: function Render() {
    const [region, setRegion] = useState<string | null>(null);
    return (
      <div className="flex flex-col gap-6">
        <Field
          label="默认地区"
          required
          help="决定新任务从哪条补给线出发"
          error={region === null ? "请选一个地区" : undefined}
        >
          <Select
            items={regions}
            placeholder="请选择"
            value={region}
            onValueChange={setRegion}
          />
        </Field>
        <Field label="备用地区" disabled help="先选默认地区">
          <Select items={regions} placeholder="请选择" />
        </Field>
      </div>
    );
  },
};

export const Groups: Story = {
  name: "分组",
  render: () => (
    <Select items={regions} aria-label="地区" defaultValue="ridge">
      <SelectGroup label="已勘探">
        <SelectItem value="valley">四号谷地</SelectItem>
        <SelectItem value="ridge">北岭</SelectItem>
        <SelectItem value="basin">盐湖盆地</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup label="未开放">
        <SelectItem value="delta" disabled>
          三角洲
        </SelectItem>
      </SelectGroup>
    </Select>
  ),
};

const batches = Array.from({ length: 30 }, (_, index) => ({
  value: String(index + 1),
  label: `第 ${index + 1} 批`,
}));

export const LongList: Story = {
  name: "选项很多时面板里滚动",
  render: () => <Select items={batches} aria-label="批次" defaultValue="12" />,
};

export const StrongPanel: Story = {
  name: "深色面板",
  render: () => (
    <Select
      items={[
        { value: "zh", label: "简体中文" },
        { value: "en", label: "English" },
        { value: "ja", label: "日本語" },
      ]}
      aria-label="语言"
      defaultValue="zh"
      panelVariant="strong"
    />
  ),
};

export const Narrow: Story = {
  name: "窄容器里不溢出",
  decorators: [],
  render: () => (
    <div className="w-40 border border-dashed border-line-strong p-3">
      <Select
        items={[
          { value: "a", label: "第七勘探区临时补给站" },
          { value: "b", label: "北岭" },
        ]}
        aria-label="站点"
        defaultValue="a"
      />
    </div>
  ),
};

/* 默认打开，供截图核对。不进文档页；面板打开时页面其余部分不可交互，所以也不并排 */
const channels = [
  { value: "site", label: "站内信" },
  { value: "mail", label: "邮件" },
  { value: "sms", label: "短信" },
  { value: "pager", label: "值班呼叫" },
  { value: "radio", label: "无线电（未接入）", disabled: true },
];

export const Multiple: Story = {
  name: "多选",
  render: function Render() {
    const [value, setValue] = useState(["site", "mail"]);
    return (
      <div className="flex flex-col gap-6">
        <Field label="通知渠道" help="可以多选；选了不关面板。">
          <Select
            multiple
            items={channels}
            value={value}
            onValueChange={setValue}
            placeholder="不通知"
          />
        </Field>
        {/* 触发器里的写法可以换 */}
        <Select
          multiple
          items={channels}
          aria-label="通知渠道（只写个数）"
          defaultValue={["site", "mail", "sms"]}
          placeholder="不通知"
          renderValue={(selected) => `已选 ${selected.length} 个渠道`}
        />
        <Select
          multiple
          items={channels}
          aria-label="通知渠道（深色面板）"
          panelVariant="strong"
          defaultValue={["pager"]}
          placeholder="不通知"
        />
      </div>
    );
  },
};

export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { defaultOpen: true, defaultValue: "ridge" },
};

export const OpenStrong: Story = {
  name: "打开的样子（深色面板）",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { defaultOpen: true, defaultValue: "ridge", panelVariant: "strong" },
};

export const OpenMultiple: Story = {
  name: "打开的样子（多选）",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  render: () => (
    <Select
      multiple
      defaultOpen
      items={channels}
      aria-label="通知渠道"
      defaultValue={["site", "mail"]}
    />
  ),
};
