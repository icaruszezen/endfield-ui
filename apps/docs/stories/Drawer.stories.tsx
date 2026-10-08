import {
  Button,
  Checkbox,
  DialogClose,
  Drawer,
  Field,
  List,
  ListRow,
  PanelRow,
  PanelRows,
  Radio,
  RadioGroup,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Drawer 抽屉",
  component: Drawer,
  // 抽屉占的是整个视口，不能并排开两份
  parameters: { sideBySide: false },
  args: {
    title: "合金锭",
    description: "在不离开当前页面的前提下查看一个条目。",
    side: "right",
    size: "md",
    accent: false,
    trigger: <Button variant="light">查看详情</Button>,
    children: (
      <PanelRows className="px-0">
        <PanelRow label="数量">128</PanelRow>
        <PanelRow label="稀有度">3</PanelRow>
        <PanelRow label="存放">北区仓储站 · A-07</PanelRow>
      </PanelRows>
    ),
  },
  argTypes: {
    side: { control: "inline-radio", options: ["right", "left", "bottom"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Filters: Story = {
  name: "筛选面板（带行动区）",
  render: () => (
    <Drawer
      accent
      trigger={<Button variant="light">筛选</Button>}
      title="筛选条件"
      footer={
        <>
          <DialogClose>
            <Button variant="light">重置</Button>
          </DialogClose>
          <DialogClose>
            <Button>应用</Button>
          </DialogClose>
        </>
      }
    >
      <div className="grid gap-6">
        <Field group label="类别">
          <Checkbox defaultChecked>矿物</Checkbox>
          <Checkbox defaultChecked>燃料</Checkbox>
          <Checkbox>货箱</Checkbox>
        </Field>
        <Field group label="排序">
          <RadioGroup defaultValue="count" aria-label="排序">
            <Radio value="count">按数量</Radio>
            <Radio value="rarity">按稀有度</Radio>
            <Radio value="name">按名称</Radio>
          </RadioGroup>
        </Field>
      </div>
    </Drawer>
  ),
};

export const LeftNavigation: Story = {
  name: "左侧：窄屏上的导航",
  render: () => (
    <Drawer
      side="left"
      size="sm"
      trigger={<Button variant="light">菜单</Button>}
      title="导航"
    >
      <List className="-mx-4">
        <ListRow href="#terminal" selected>
          终端
        </ListRow>
        <ListRow href="#depot">仓库</ListRow>
        <ListRow href="#survey">测绘</ListRow>
        <ListRow href="#settings">设置</ListRow>
      </List>
    </Drawer>
  ),
};

export const BottomSheet: Story = {
  name: "底部：移动端的操作菜单",
  render: () => (
    <Drawer
      side="bottom"
      trigger={<Button variant="light">更多操作</Button>}
      title="合金锭"
      description="可以向下划走。"
    >
      <List className="-mx-4">
        <ListRow onClick={() => {}}>锁定</ListRow>
        <ListRow onClick={() => {}}>移动到…</ListRow>
        <ListRow onClick={() => {}}>销毁</ListRow>
      </List>
    </Drawer>
  ),
};

/* 默认打开，供截图核对。不进文档页 */
export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  args: {
    defaultOpen: true,
    accent: true,
    footer: (
      <DialogClose>
        <Button>完成</Button>
      </DialogClose>
    ),
  },
};

export const OpenBottom: Story = {
  name: "打开的样子（底部）",
  tags: ["!autodocs"],
  args: { defaultOpen: true, side: "bottom" },
};
