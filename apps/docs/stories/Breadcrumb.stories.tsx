import { Breadcrumb, BreadcrumbItem } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Breadcrumb 面包屑",
  component: Breadcrumb,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: "基本",
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem href="#archive">档案</BreadcrumbItem>
      <BreadcrumbItem href="#station">站点</BreadcrumbItem>
      <BreadcrumbItem current>测绘记录</BreadcrumbItem>
    </Breadcrumb>
  ),
};

export const Collapsed: Story = {
  name: "路径很长时折叠中间项",
  render: () => (
    <Breadcrumb maxItems={3}>
      <BreadcrumbItem href="#archive">档案</BreadcrumbItem>
      <BreadcrumbItem href="#region">第七勘探区</BreadcrumbItem>
      <BreadcrumbItem href="#station">管廊站点</BreadcrumbItem>
      <BreadcrumbItem href="#layer">第三岩层</BreadcrumbItem>
      <BreadcrumbItem href="#log">测绘记录</BreadcrumbItem>
      <BreadcrumbItem current>10 月 8 日</BreadcrumbItem>
    </Breadcrumb>
  ),
};

export const Narrow: Story = {
  name: "窄容器里换行",
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <Breadcrumb>
        <BreadcrumbItem href="#archive">档案</BreadcrumbItem>
        <BreadcrumbItem href="#region">第七勘探区</BreadcrumbItem>
        <BreadcrumbItem href="#station">管廊站点</BreadcrumbItem>
        <BreadcrumbItem current>测绘记录</BreadcrumbItem>
      </Breadcrumb>
    </div>
  ),
};
