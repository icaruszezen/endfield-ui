import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageHeader,
  PageHeaderBack,
  Stat,
  Tab,
  TabList,
  Tabs,
  Tag,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { RouterLink } from "./_shared/RouterLink";

/* 文案全部虚构 */
const meta = {
  title: "控件/PageHeader 页头",
  component: PageHeader,
  args: {
    title: "档案",
    meta: "// ARCHIVE　共 128 条",
    description: "按站点和月份归档的现场记录。",
    divider: false,
    sticky: false,
    level: 1,
  },
  argTypes: {
    breadcrumb: { control: false },
    back: { control: false },
    actions: { control: false },
    children: { control: false },
    level: { control: "inline-radio", options: [1, 2, 3] },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const breadcrumb = (
  <Breadcrumb>
    <BreadcrumbItem href="#station">站点</BreadcrumbItem>
    <BreadcrumbItem href="#seventh">第七勘探队</BreadcrumbItem>
    <BreadcrumbItem current>档案</BreadcrumbItem>
  </Breadcrumb>
);

const actions = (
  <>
    <Button>导出</Button>
    <Button variant="action">新建记录</Button>
  </>
);

export const Playground: Story = {
  name: "试一试",
  args: { breadcrumb, actions },
};

/* 只有"回上一页"一个去处的页面：返回方块代替面包屑 */
export const WithBack: Story = {
  name: "带返回",
  parameters: { controls: { disable: true } },
  render: () => (
    <PageHeader
      back={<PageHeaderBack href="#archive" aria-label="返回档案" />}
      meta="// TR-2041　2026.10.08"
      title="十月第二批"
      description="北区仓储站发出，三号管廊转运。"
      actions={
        <>
          <Button>退回</Button>
          <Button variant="action">签收</Button>
        </>
      }
    />
  ),
};

export const Entrance: Story = {
  name: "入场动画",
  parameters: { controls: { disable: true } },
  render: function EntranceStory() {
    const [run, setRun] = useState(0);
    return (
      <div className="flex flex-col items-start gap-6">
        <PageHeader
          key={run}
          className="w-full"
          back={<PageHeaderBack href="#archive" aria-label="返回档案" />}
          meta="// TR-2041　2026.10.08"
          title="十月第二批"
          description="北区仓储站发出，三号管廊转运。"
          actions={<Button variant="action">签收</Button>}
        />
        <Button size="sm" onClick={() => setRun((value) => value + 1)}>
          重播
        </Button>
        <p className="text-sm text-ink-secondary">
          微文字行 → 标题 → 说明，各自从左边淡入归位；挂上的时候播一次。
          返回方块和右边的按钮不动；吸顶的页头不播。
        </p>
      </div>
    );
  },
};

/* 各格都是可选的：只给标题也成立 */
export const Slots: Story = {
  name: "各格可有可无",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-10">
      <PageHeader title="只有标题" />
      <PageHeader title="标题和微文字行" meta="// SETTINGS" />
      <PageHeader
        title="标题和行动"
        actions={<Button variant="action">保存</Button>}
      />
      <PageHeader
        title="标题和说明"
        description="说明写这一页是做什么的，一两句就够。写不出来就不写。"
        divider
      />
    </div>
  ),
};

/* 标题下面的那一行由使用方定：这里是一条页签，再加一条分隔线 */
export const WithTabs: Story = {
  name: "下面一行放页签",
  parameters: { controls: { disable: true } },
  render: () => (
    <PageHeader
      breadcrumb={breadcrumb}
      title="档案"
      actions={<Button variant="action">新建记录</Button>}
    >
      <Tabs defaultValue="all">
        <TabList aria-label="档案分类">
          <Tab value="all">全部</Tab>
          <Tab value="survey">测绘</Tab>
          <Tab value="supply">补给</Tab>
          <Tab value="film">影像</Tab>
        </TabList>
      </Tabs>
    </PageHeader>
  ),
};

export const WithStats: Story = {
  name: "下面一行放统计",
  parameters: { controls: { disable: true } },
  render: () => (
    <PageHeader
      meta="// DISPATCH"
      title={
        <>
          调度台
          <Tag size="sm" className="ml-3 align-middle">
            试运行
          </Tag>
        </>
      }
      actions={<Button>导出</Button>}
      divider
    >
      <div className="flex flex-wrap gap-x-12 gap-y-6">
        <Stat label="IN TRANSIT" value="14" unit="批" size="lg" />
        <Stat label="DELAYED" value="2" unit="批" />
        <Stat label="LOAD" value="386" unit="件" />
      </div>
    </PageHeader>
  ),
};

/* 长标题折行，不截断；返回方块和行动区对着标题的第一行 */
export const LongTitle: Story = {
  name: "长标题折行",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-xl">
      <PageHeader
        back={<PageHeaderBack href="#archive" aria-label="返回档案" />}
        title="第七勘探区首批测绘数据的归档说明与复核安排（十月修订）"
        description="这一版把复核从月底提前到了每周五，归档的截止时间不变。"
        actions={<Button>下载</Button>}
      />
    </div>
  ),
};

/* 返回的三种形态：按钮、链接、路由库的链接组件；也可以直接放一个带字的 back 按钮 */
export const Back: Story = {
  name: "返回的几种写法",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={<PageHeaderBack onClick={() => history.back()} />}
        title="按钮：自己处理点击"
      />
      <PageHeader
        back={<PageHeaderBack href="#archive" aria-label="返回档案" />}
        title="链接：传 href"
      />
      <PageHeader
        back={
          <PageHeaderBack
            render={<RouterLink to="archive" />}
            aria-label="返回档案"
          />
        }
        title="路由库的链接：传 render"
      />
      <PageHeader
        back={<PageHeaderBack disabled />}
        title="禁用：没有上一页可回"
      />
      <PageHeader
        back={
          <Button variant="back" href="#archive">
            档案
          </Button>
        }
        title="带字的 back 按钮"
      />
    </div>
  ),
};

/* 吸在滚动容器的顶上：带实底和底下那条线，正文从它下面滚过去 */
export const Sticky: Story = {
  name: "吸顶",
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      tabIndex={0}
      role="region"
      aria-label="正文"
      data-scroller=""
      className="h-80 overflow-auto border border-line px-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
    >
      <PageHeader
        sticky
        back={<PageHeaderBack href="#archive" aria-label="返回档案" />}
        title="十月第二批"
        actions={<Button variant="action">签收</Button>}
      />
      <div className="flex flex-col gap-4 py-6 text-ink-secondary">
        {Array.from({ length: 14 }, (_, index) => (
          <p key={index}>
            {`第 ${index + 1} 段：这一段是编的，用来把正文撑到够长，滚动的时候能看见页头留在顶上。`}
          </p>
        ))}
      </div>
    </div>
  ),
};

/* 按自身的宽度响应：行动区放不下就整块折到标题下面，标题小一档 */
export const Narrow: Story = {
  name: "窄容器里行动区折下去",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-64 border border-dashed border-line-strong p-3">
      <PageHeader
        breadcrumb={breadcrumb}
        back={<PageHeaderBack href="#archive" aria-label="返回档案" />}
        meta="// TR-2041"
        title="十月第二批"
        description="北区仓储站发出，三号管廊转运。"
        actions={
          <>
            <Button size="sm">退回</Button>
            <Button size="sm" variant="action">
              签收
            </Button>
          </>
        }
      />
    </div>
  ),
};
