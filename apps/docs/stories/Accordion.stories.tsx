import {
  Accordion,
  AccordionItem,
  Panel,
  PanelHeader,
  Switch,
  Tag,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

/* 文案全部虚构 */
const items = (
  <>
    <AccordionItem value="route" title="批次发出之后还能改派吗">
      <p className="text-ink-secondary">
        能。在调度台里选中批次，再选新的目的站；已经过了中转站的批次要先召回。
      </p>
    </AccordionItem>
    <AccordionItem value="delay" title="延误的批次怎么处理">
      <p className="text-ink-secondary">
        延误超过两小时会自动上报给值班调度。你也可以在批次的右键菜单里手动标记。
      </p>
    </AccordionItem>
    <AccordionItem value="archive" title="归档之后去哪里找">
      <p className="text-ink-secondary">
        到站满三十天的批次进档案，按站点和月份分开存放。
      </p>
    </AccordionItem>
  </>
);

const meta = {
  title: "控件/Accordion 折叠面板",
  component: Accordion,
  args: {
    multiple: false,
    size: "md",
    searchable: false,
    disabled: false,
    children: items,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    level: { control: "inline-radio", options: [2, 3, 4, 5, 6] },
    children: { control: false },
    value: { control: false },
    defaultValue: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const DefaultOpen: Story = {
  name: "默认展开一项",
  args: { defaultValue: ["delay"] },
};

export const Multiple: Story = {
  name: "可以同时展开几项",
  args: { multiple: true, defaultValue: ["route", "archive"] },
};

export const Compact: Story = {
  name: "紧凑",
  args: { size: "sm", defaultValue: ["route"] },
};

export const Extra: Story = {
  name: "标题右侧的补充与禁用",
  render: (args) => (
    <Accordion {...args} defaultValue={["north"]}>
      <AccordionItem value="north" title="北区" extra="8 个站">
        <p className="text-ink-secondary">北区一号站到八号站，全部在线。</p>
      </AccordionItem>
      <AccordionItem
        value="south"
        title="南岸"
        extra={
          <Tag size="sm" variant="accent">
            NEW
          </Tag>
        }
      >
        <p className="text-ink-secondary">南岸六号站本周并入线路。</p>
      </AccordionItem>
      <AccordionItem value="east" title="东线" extra="维护中" disabled>
        <p className="text-ink-secondary">东线暂停调度。</p>
      </AccordionItem>
    </Accordion>
  ),
};

/* 收起的内容也留在页面里：按 Ctrl+F 搜"三十天"，那一节会自己展开 */
export const Searchable: Story = {
  name: "页内查找能找到收起的内容",
  args: { searchable: true },
};

/* 放进面板：把设置里不常用的那一组收起来 */
export const InPanel: Story = {
  name: "放进面板",
  parameters: { controls: { disable: true } },
  render: () => (
    <Panel>
      <PanelHeader variant="line">通知</PanelHeader>
      {/* 面板自己有边线：去掉最上面那条，最下面那条和面板的边线叠在一起 */}
      <Accordion multiple size="sm" level={4} className="-mb-px border-t-0">
        <AccordionItem value="shipment" title="批次">
          <div className="flex flex-col gap-3">
            <Switch defaultChecked>到站时通知我</Switch>
            <Switch>延误时通知我</Switch>
          </div>
        </AccordionItem>
        <AccordionItem value="station" title="站点">
          <div className="flex flex-col gap-3">
            <Switch>站点离线时通知我</Switch>
          </div>
        </AccordionItem>
      </Accordion>
    </Panel>
  ),
};
