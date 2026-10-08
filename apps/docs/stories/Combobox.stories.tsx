import { Combobox, Field, type ComboboxSingleProps } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentType } from "react";
import { stationGroups, stations } from "./_shared/stations";

const meta = {
  title: "控件/Combobox 组合框",
  // 属性是单选、多选两支的联合；控件面板按单选那一支来
  component: Combobox as ComponentType<ComboboxSingleProps>,
  args: {
    items: stations,
    placeholder: "输入站名或编号",
    "aria-label": "站点",
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
} satisfies Meta<ComboboxSingleProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InField: Story = {
  name: "放进字段",
  render: function Render() {
    const [station, setStation] = useState<string | null>(null);
    return (
      <Field
        label="常驻站点"
        help={
          station === null
            ? "二十几个站，打几个字就能找到；也可以输入编号，比如 N-07。"
            : `已选 ${station}`
        }
      >
        <Combobox
          items={stations}
          placeholder="输入站名或编号"
          value={station}
          onValueChange={setStation}
        />
      </Field>
    );
  },
};

export const Groups: Story = {
  name: "分组",
  args: { items: stationGroups, defaultValue: "s2" },
};

export const Multiple: Story = {
  name: "多选",
  render: function Render() {
    const [picked, setPicked] = useState(["n7", "s2"]);
    return (
      <Field
        label="巡检路线"
        help={`已选 ${picked.length} 个站。输入框空着时按退格删掉最后一个。`}
      >
        <Combobox
          multiple
          items={stationGroups}
          placeholder="输入站名或编号"
          value={picked}
          onValueChange={setPicked}
        />
      </Field>
    );
  },
};

export const Sizes: Story = {
  name: "尺寸与两种外框",
  render: () => (
    <div className="flex flex-col gap-4">
      <Combobox items={stations} size="sm" aria-label="小" defaultValue="n1" />
      <Combobox items={stations} size="md" aria-label="中" defaultValue="n2" />
      <Combobox items={stations} size="lg" aria-label="大" defaultValue="n3" />
      <Combobox
        multiple
        items={stations}
        size="sm"
        aria-label="小，多选"
        defaultValue={["n1", "n2"]}
      />
      <Combobox
        multiple
        items={stations}
        size="lg"
        aria-label="大，多选"
        defaultValue={["n1", "n2"]}
      />
      {/* 四边描边的那种放在凹陷底色的区域里 */}
      <div className="bg-surface-sunken p-3">
        <Combobox
          items={stations}
          variant="outline"
          aria-label="描边"
          placeholder="outline"
        />
      </div>
    </div>
  ),
};

export const States: Story = {
  name: "错误与禁用",
  render: () => (
    <div className="flex flex-col gap-6">
      <Field label="常驻站点" error="这个站点已经停用，换一个。">
        <Combobox items={stations} defaultValue="s6" />
      </Field>
      <Field label="常驻站点" disabled help="调度期间不能更改。">
        <Combobox items={stations} defaultValue="n7" />
      </Field>
      <Field label="巡检路线" disabled>
        <Combobox multiple items={stations} defaultValue={["n7", "s2"]} />
      </Field>
    </div>
  ),
};

export const StrongPanel: Story = {
  name: "固定深色的面板",
  args: { panelVariant: "strong", defaultValue: "n3" },
};

export const Narrow: Story = {
  name: "窄容器里的多选",
  render: () => (
    <div className="w-48">
      <Combobox
        multiple
        items={stations}
        aria-label="巡检路线"
        defaultValue={["n7", "s2", "e3"]}
      />
    </div>
  ),
};

/* 默认打开，供截图核对。不进文档页，也不并排 */
export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { items: stationGroups, defaultOpen: true, defaultValue: "n3" },
};

export const OpenMultiple: Story = {
  name: "多选打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  render: () => (
    <Combobox
      multiple
      items={stations}
      aria-label="巡检路线"
      defaultOpen
      defaultValue={["n2", "n4"]}
    />
  ),
};
