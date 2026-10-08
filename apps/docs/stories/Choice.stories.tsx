import { Checkbox, Radio, RadioGroup, Switch } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Choice 选择控件",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckboxStates: Story = {
  name: "复选框",
  render: () => (
    <div className="grid max-w-md grid-cols-2 gap-x-8">
      <Checkbox>未选</Checkbox>
      <Checkbox disabled>未选且禁用</Checkbox>
      <Checkbox defaultChecked>已选</Checkbox>
      <Checkbox defaultChecked disabled>
        已选且禁用
      </Checkbox>
      <Checkbox indeterminate>半选</Checkbox>
      <Checkbox indeterminate disabled>
        半选且禁用
      </Checkbox>
      <Checkbox invalid>错误</Checkbox>
    </div>
  ),
};

const zones = ["管廊北段", "第三岩层", "旧输料口"];

function SelectAll() {
  const [selected, setSelected] = useState<string[]>(["管廊北段"]);
  const all = selected.length === zones.length;
  return (
    <div className="flex flex-col">
      <Checkbox
        checked={all}
        indeterminate={selected.length > 0 && !all}
        onCheckedChange={(checked) => setSelected(checked ? zones : [])}
      >
        全部区域
      </Checkbox>
      <div className="ml-7 flex flex-col">
        {zones.map((zone) => (
          <Checkbox
            key={zone}
            checked={selected.includes(zone)}
            onCheckedChange={(checked) =>
              setSelected((current) =>
                checked
                  ? [...current, zone]
                  : current.filter((item) => item !== zone),
              )
            }
          >
            {zone}
          </Checkbox>
        ))}
      </div>
    </div>
  );
}

export const Indeterminate: Story = {
  name: "半选：全选与子项",
  render: () => <SelectAll />,
};

export const RadioStates: Story = {
  name: "单选组",
  render: () => (
    <div className="flex flex-col gap-8">
      <RadioGroup aria-label="测绘精度" defaultValue="standard">
        <Radio value="draft">草图</Radio>
        <Radio value="standard">标准</Radio>
        <Radio value="fine" disabled>
          精细（暂不可用）
        </Radio>
      </RadioGroup>
      <RadioGroup
        aria-label="归档范围"
        defaultValue="all"
        orientation="horizontal"
      >
        <Radio value="all">全部</Radio>
        <Radio value="mine">仅本班</Radio>
        <Radio value="none">不归档</Radio>
      </RadioGroup>
      <RadioGroup aria-label="已锁定的选项" defaultValue="b" disabled>
        <Radio value="a">禁用未选</Radio>
        <Radio value="b">禁用已选</Radio>
      </RadioGroup>
    </div>
  ),
};

export const SwitchStates: Story = {
  name: "开关",
  render: () => (
    <div className="grid max-w-md grid-cols-2 gap-x-8">
      <Switch>关</Switch>
      <Switch disabled>关且禁用</Switch>
      <Switch defaultChecked>开</Switch>
      <Switch defaultChecked disabled>
        开且禁用
      </Switch>
    </div>
  ),
};

export const DualLabelSwitch: Story = {
  name: "双标签开关",
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <div className="grid grid-cols-2 gap-x-8">
        <Switch aria-label="三维视图" offLabel="2D" onLabel="3D" />
        <Switch aria-label="三维视图" offLabel="2D" onLabel="3D" defaultChecked />
        <Switch aria-label="三维视图" offLabel="2D" onLabel="3D" disabled />
        <Switch
          aria-label="三维视图"
          offLabel="2D"
          onLabel="3D"
          defaultChecked
          disabled
        />
      </div>
      <Switch offLabel="列表" onLabel="网格">
        档案的排列方式
      </Switch>
      {/* 压在图像或深色版块上：轨道是半透明的 */}
      <div className="hatch bg-control p-6">
        <Switch aria-label="三维视图" offLabel="2D" onLabel="3D" />
      </div>
    </div>
  ),
};

export const LongLabel: Story = {
  name: "长标签换行",
  render: () => (
    <div className="flex w-56 flex-col border border-dashed border-line-strong p-3">
      <Checkbox>测绘数据归档后同时抄送给下一班的值守人员</Checkbox>
      <Switch>夜间只接收紧急告警，其余消息留到早班再推送</Switch>
    </div>
  ),
};
