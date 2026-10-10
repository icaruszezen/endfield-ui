import { Tab, TabList, TabPanel, Tabs } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/Tabs 页签",
  component: Tabs,
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["block", "capsule", "wedge"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const sections = [
  { value: "news", label: "新闻", body: "最近的新闻条目。" },
  { value: "notice", label: "公告", body: "维护与版本公告。" },
  { value: "event", label: "活动", body: "进行中的活动。" },
  { value: "media", label: "影像", body: "视频与图集。" },
];

export const Block: Story = {
  name: "block 格子",
  args: { defaultValue: "news" },
  render: (args) => (
    <Tabs {...args}>
      <TabList aria-label="情报分类">
        {sections.map((section) => (
          <Tab key={section.value} value={section.value}>
            {section.label}
          </Tab>
        ))}
      </TabList>
      {sections.map((section) => (
        <TabPanel
          key={section.value}
          value={section.value}
          className="border-t border-line p-4 text-sm text-ink-secondary"
        >
          {section.body}
        </TabPanel>
      ))}
    </Tabs>
  ),
};

export const Capsule: Story = {
  name: "capsule 胶囊",
  args: { defaultValue: "all", variant: "capsule" },
  render: (args) => (
    <Tabs {...args}>
      <TabList aria-label="物品类目">
        <Tab value="all">全部</Tab>
        <Tab value="weapon">武器</Tab>
        <Tab value="material">材料</Tab>
        <Tab value="locked" disabled>
          未解锁
        </Tab>
      </TabList>
      <TabPanel value="all" className="p-4 text-sm text-ink-secondary">
        全部物品。
      </TabPanel>
      <TabPanel value="weapon" className="p-4 text-sm text-ink-secondary">
        武器。
      </TabPanel>
      <TabPanel value="material" className="p-4 text-sm text-ink-secondary">
        材料。
      </TabPanel>
    </Tabs>
  ),
};

/* 胶囊各有各的宽：选中的底滑过去的时候宽度跟着变；放不下时这一栏横向滚动，底跟着内容走 */
export const CapsuleWide: Story = {
  name: "胶囊：宽窄不一、横向滚动",
  args: { defaultValue: "all", variant: "capsule" },
  render: (args) => (
    <div className="max-w-sm">
      <Tabs {...args}>
        <TabList aria-label="物资类目">
          <Tab value="all">全部</Tab>
          <Tab value="consumable">消耗品与补给</Tab>
          <Tab value="part">部件</Tab>
          <Tab value="blueprint">图纸与测绘记录</Tab>
          <Tab value="archive">归档</Tab>
          <Tab value="pending">待清点的物资</Tab>
        </TabList>
      </Tabs>
    </div>
  ),
};

export const Sizes: Story = {
  name: "尺寸与禁用",
  args: { defaultValue: "a" },
  render: () => (
    <div className="flex flex-col gap-8">
      {(["md", "sm"] as const).map((size) => (
        <Tabs key={size} defaultValue="a" size={size}>
          <TabList aria-label={`${size} 页签`}>
            <Tab value="a">概览</Tab>
            <Tab value="b">明细</Tab>
            <Tab value="c" disabled>
              未开放
            </Tab>
          </TabList>
        </Tabs>
      ))}
      {(["md", "sm"] as const).map((size) => (
        <Tabs key={size} defaultValue="a" size={size} variant="capsule">
          <TabList aria-label={`${size} 胶囊页签`}>
            <Tab value="a">概览</Tab>
            <Tab value="b">明细</Tab>
            <Tab value="c" disabled>
              未开放
            </Tab>
          </TabList>
        </Tabs>
      ))}
    </div>
  ),
};

export const Overflow: Story = {
  name: "页签很多时横向滚动",
  args: { defaultValue: "1" },
  render: () => (
    <div className="max-w-md">
      <Tabs defaultValue="1">
        <TabList aria-label="区域">
          {Array.from({ length: 9 }, (_, index) => (
            <Tab key={index} value={String(index + 1)}>
              {`第 ${index + 1} 区`}
            </Tab>
          ))}
        </TabList>
      </Tabs>
    </div>
  ),
};

export const Controlled: Story = {
  name: "受控",
  args: { defaultValue: "news" },
  render: function ControlledStory() {
    const [value, setValue] = useState("notice");
    return (
      <div className="flex flex-col gap-4">
        <Tabs value={value} onValueChange={setValue}>
          <TabList aria-label="情报分类">
            {sections.map((section) => (
              <Tab key={section.value} value={section.value}>
                {section.label}
              </Tab>
            ))}
          </TabList>
        </Tabs>
        <p className="font-tech text-xs text-ink-secondary">
          {`// value = ${value}`}
        </p>
      </div>
    );
  },
};

const depots = [
  { value: "supply", label: "物资", body: "消耗品与材料。" },
  { value: "gear", label: "装备", body: "可以装配的部件。" },
  { value: "archive", label: "图鉴", body: "见过的全部条目。" },
];

export const Wedge: Story = {
  name: "楔形",
  args: { defaultValue: "supply" },
  render: () => (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="supply" variant="wedge">
        <TabList aria-label="仓库分类">
          {depots.map((depot) => (
            <Tab key={depot.value} value={depot.value}>
              {depot.label}
            </Tab>
          ))}
          <Tab value="sealed" disabled>
            封存
          </Tab>
        </TabList>
        {depots.map((depot) => (
          <TabPanel key={depot.value} value={depot.value} className="pt-4">
            {depot.body}
          </TabPanel>
        ))}
      </Tabs>
      <Tabs defaultValue="gear" variant="wedge" size="sm">
        <TabList aria-label="仓库分类（小号）">
          {depots.map((depot) => (
            <Tab key={depot.value} value={depot.value}>
              {depot.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>
      <p className="max-w-prose text-sm text-ink-secondary">
        游戏风格界面的一级页签。一个界面里只放一组；二级的分类用格子式或胶囊。
      </p>
    </div>
  ),
};
