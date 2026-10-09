import {
  AvatarSwitcher,
  AvatarSwitcherItem,
  BackToTop,
  Badge,
  Button,
  Carousel,
  CarouselSlide,
  ChevronLeft,
  ChevronRight,
  IconButton,
  ImageViewer,
  ImageViewerItem,
  Panel,
  PanelHeader,
  PanelRow,
  PanelRows,
  Schedule,
  ScheduleItem,
  ScheduleTrack,
  SectionTitle,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagPair,
  Toc,
  TocItem,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";
import { IsoCube } from "./_shared/IsoCube";
import { photo, ScenePlaceholder } from "./_shared/Placeholders";
import { crew } from "./_shared/Portraits";
import { CrateIcon, RouteIcon, SlidersIcon } from "./_shared/ResourceIcons";

/**
 * 搭一个官网气质的内容页：分节标题、页签、面板，加上媒体轮播、头像切换和排期，最后一组能点开看大图的现场照片；够宽时右边一列页内目录，滚下去之后右下角有回到顶部。
 * 文案与数据全部虚构；图是原创的占位图和几何剪影。
 */
const meta = {
  title: "示例/内容页",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* 虚构的现场照片：横幅、竖幅、宽幅都有，大图层里各按原比例整张显示 */
const sitePhotos = [
  {
    title: "三号管廊入口",
    description: "北段复测当天拍的。闸门左侧的信标是这次新装的。",
    frame: "landscape",
  },
  {
    title: "信标 B-12",
    description: "信标装在管壁的高处，要仰着看。",
    frame: "portrait",
  },
  {
    title: "第三岩层营地全景",
    description: "从东线补给点望过去。",
    frame: "wide",
  },
  { title: "滤芯入库", description: "十二件，分两箱。", frame: "landscape" },
  {
    title: "夜班交接",
    description: "没做完的事写在交接单最下面一栏。",
    frame: "portrait",
  },
] as const;

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

function EntryList({
  items,
}: {
  items: (typeof entries)[keyof typeof entries];
}) {
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

const works = [
  {
    title: "线路测绘",
    description:
      "沿着管廊布设信标，把走过的每一段记进图里。没测过的地方在图上是一片斜纹。",
  },
  {
    title: "物资调度",
    description: "把批次派往各个站点；延误超过两小时的会自动上报给值班调度。",
  },
  {
    title: "站点维护",
    description: "滤芯、电池、信标都有寿命。到期前三天，站点会出现在待办里。",
  },
];

/* 官网"干员情报"的排法：左边一列头像，右边是选中这个人的介绍 */
function Crew() {
  const people = crew.slice(0, 4);
  const [current, setCurrent] = useState(people[0]!.value);
  const person = people.find((item) => item.value === current)!;
  return (
    <div className="flex items-start gap-6">
      <AvatarSwitcher
        aria-label="队员"
        value={current}
        onValueChange={setCurrent}
      >
        {people.map((item) => (
          <AvatarSwitcherItem
            key={item.value}
            value={item.value}
            label={item.label}
            src={item.src}
          />
        ))}
      </AvatarSwitcher>
      <div aria-live="polite" className="flex min-w-0 flex-col gap-3 pt-10">
        <p className="text-3xl font-bold wrap-anywhere">
          <span aria-hidden="true" className="text-line-strong">
            {"[ "}
          </span>
          {person.label}
          <span aria-hidden="true" className="text-line-strong">
            {" ]"}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <TagPair name="岗位" value={person.role} />
          <TagPair name="所属" value="第七勘探队" />
        </div>
        <p className="max-w-prose text-ink-secondary">
          {`${person.label}负责${person.role}。这段介绍是编的，用来看一段正文放在这里的样子。`}
        </p>
      </div>
    </div>
  );
}

const chapters = [
  ["bulletin", "最新情报"],
  ["fieldwork", "日常作业"],
  ["crew", "队员"],
  ["schedule", "本月排期"],
  ["station", "站点档案"],
] as const;

function Home() {
  // 这一页在预览里可能并排渲染两份：小节的 id 各加一个前缀，不撞在一起
  const prefix = useId().replace(/[^a-z0-9]/gi, "");
  const anchor = (name: (typeof chapters)[number][0]) => `${prefix}-${name}`;

  return (
    <div className="@container mx-auto max-w-5xl">
      <div className="flex items-start justify-center gap-10">
        <Content anchor={anchor} />
        {/* 容器够宽才有这一列；窄了就不显示，由页面自己决定，不是目录的事 */}
        <Toc
          title="// 本页"
          className="sticky top-6 hidden w-40 shrink-0 @4xl:block"
        >
          {chapters.map(([name, title]) => (
            <TocItem key={name} href={`#${anchor(name)}`}>
              {title}
            </TocItem>
          ))}
        </Toc>
      </div>
    </div>
  );
}

function Content({
  anchor,
}: {
  anchor: (name: (typeof chapters)[number][0]) => string;
}) {
  return (
    <div className="@container flex max-w-3xl min-w-0 flex-1 flex-col gap-12">
      <SectionTitle
        variant="band"
        subtitle="Survey Division"
        illustration={<IsoCube />}
      >
        Seventh Field
      </SectionTitle>

      <section id={anchor("bulletin")} className="flex flex-col gap-6">
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
            <IconButton
              aria-label="上一页"
              variant="floating"
              size="sm"
              disabled
            >
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

      <section id={anchor("fieldwork")} className="flex flex-col gap-6">
        <SectionTitle latin="Fieldwork">日常作业</SectionTitle>
        <Carousel aria-label="日常作业" indicator>
          {works.map((work, position) => (
            <CarouselSlide
              key={work.title}
              title={work.title}
              description={work.description}
            >
              <ScenePlaceholder seed={position} />
            </CarouselSlide>
          ))}
        </Carousel>
      </section>

      <section id={anchor("crew")} className="flex flex-col gap-6">
        <SectionTitle latin="Crew">队员</SectionTitle>
        <Crew />
      </section>

      <section id={anchor("schedule")} className="flex flex-col gap-6">
        <SectionTitle latin="Schedule" meta="// 十月">
          本月排期
        </SectionTitle>
        <Schedule
          label="十月排期"
          start="2026-10-01"
          end="2026-10-31"
          today="2026-10-09"
        >
          <ScheduleTrack label="测绘" icon={<RouteIcon />}>
            <ScheduleItem
              start="2026-10-01"
              end="2026-10-12"
              title="管廊北段测绘"
              type="限时"
              media={<ScenePlaceholder seed={0} />}
            />
            <ScheduleItem
              start="2026-10-15"
              end="2026-10-28"
              title="第三岩层复测"
              type="常驻"
              media={<ScenePlaceholder seed={1} />}
            />
          </ScheduleTrack>
          <ScheduleTrack label="补给" icon={<CrateIcon />}>
            <ScheduleItem
              start="2026-10-05"
              end="2026-10-11"
              title="南岸补给周"
              type="双倍"
            />
            <ScheduleItem
              start="2026-10-19"
              end="2026-10-25"
              title="北区补给周"
              type="双倍"
            />
          </ScheduleTrack>
          <ScheduleTrack label="系统" icon={<SlidersIcon />}>
            <ScheduleItem
              variant="system"
              start="2026-10-01"
              end="2026-10-31"
              title="每日巡检签到"
            />
          </ScheduleTrack>
        </Schedule>
      </section>

      <section id={anchor("station")} className="flex flex-col gap-6">
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
        {/* 一组现场照片：点一张放大到整屏看，前后翻 */}
        <div className="flex flex-col gap-3">
          <p className="font-tech text-xs text-ink-secondary">
            {`// 现场照片　共 ${sitePhotos.length} 张`}
          </p>
          <ImageViewer aria-label="现场照片">
            {sitePhotos.map((shot, index) => (
              <ImageViewerItem
                key={shot.title}
                title={shot.title}
                description={shot.description}
              >
                <img src={photo(index, shot.frame)} alt="" />
              </ImageViewerItem>
            ))}
          </ImageViewer>
        </div>
      </section>

      {/*
        这一页在预览里可能并排渲染两份，外层又是容器查询的容器：钉在视口上的 fixed 用不了。
        放在这一栏的最后，贴着视口的下沿跟着走
      */}
      <BackToTop className="sticky bottom-4 self-end" />
    </div>
  );
}

export const Page: Story = {
  name: "勘探队主页",
  render: () => <Home />,
};
