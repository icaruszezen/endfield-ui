import {
  Badge,
  Button,
  ChevronLeft,
  ChevronRight,
  IconButton,
  Panel,
  PanelHeader,
  PanelRow,
  PanelRows,
  SectionTitle,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagPair,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IsoCube } from "./_shared/IsoCube";

/** 用第一期的控件搭一个官网气质的内容页。文案与数据全部虚构。 */
const meta = {
  title: "示例/内容页",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const entries = {
  news: [
    ["10.08", "新闻", "第七勘探区的首批测绘数据已归档"],
    ["10.05", "新闻", "补给站扩建工程进入第二阶段"],
    ["09.28", "新闻", "秋季勘探计划公开征集路线建议"],
  ],
  notice: [
    ["10.21", "维护", "终端将于 10 月 21 日凌晨停机维护"],
    ["10.02", "公告", "档案检索规则调整说明"],
  ],
} as const;

function EntryList({ items }: { items: (typeof entries)[keyof typeof entries] }) {
  return (
    <ul>
      {items.map(([date, category, title]) => (
        <li
          key={title}
          className="flex items-center gap-4 border-b border-line py-3"
        >
          <Tag variant="inverse" numeric>
            {date}
          </Tag>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{title}</p>
            <p className="font-tech text-xs text-ink-secondary">
              {`// ${category}　2026.${date}`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export const Page: Story = {
  name: "勘探队主页",
  render: () => (
    <div className="@container mx-auto flex max-w-3xl flex-col gap-12">
      <SectionTitle
        variant="band"
        subtitle="Survey Division"
        illustration={<IsoCube />}
      >
        Seventh Field
      </SectionTitle>

      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <SectionTitle latin="Bulletin" meta="// 情报　共 5 条">
            最新情报
          </SectionTitle>
          <Button variant="text" href="#all">
            查看全部
          </Button>
        </div>
        <Tabs defaultValue="news">
          <TabList aria-label="情报分类">
            <Tab value="news">新闻</Tab>
            <Tab value="notice">公告</Tab>
          </TabList>
          <TabPanel value="news" className="border-t border-line">
            <EntryList items={entries.news} />
          </TabPanel>
          <TabPanel value="notice" className="border-t border-line">
            <EntryList items={entries.notice} />
          </TabPanel>
        </Tabs>
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-muted p-1.5">
            <IconButton aria-label="上一页" variant="floating" size="sm" disabled>
              <ChevronLeft />
            </IconButton>
            <span className="px-2 font-tech text-sm tabular-nums">01 / 04</span>
            <IconButton aria-label="下一页" variant="floating" size="sm">
              <ChevronRight />
            </IconButton>
          </div>
          <Badge count={5} label="5 条未读">
            <Button variant="light">未读</Button>
          </Badge>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionTitle latin="Station">站点档案</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <TagPair name="所属" value="第七勘探队" />
          <TagPair name="职能" value="地质测绘" />
          <TagPair name="负责人" value="示例姓名" emphasis />
        </div>
        <div className="grid gap-6 @2xl:grid-cols-2">
          <Panel>
            <PanelHeader extra={<span className="font-tech">03</span>}>
              测绘进度
            </PanelHeader>
            <PanelRows>
              <PanelRow label="采样点">128</PanelRow>
              <PanelRow label="已完成">96</PanelRow>
              <PanelRow label="平均深度">42.5 m</PanelRow>
            </PanelRows>
          </Panel>
          <div className="flex flex-col justify-between gap-6">
            <p className="text-ink-secondary">
              站点建在一段废弃的输料管廊上方。这里的每一份记录都按采样日期归档，可以按区域和岩层检索。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="action" size="lg">
                进入终端
              </Button>
              <Button size="lg">更多情报</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};
