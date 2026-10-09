import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  DashIndicator,
  DialogClose,
  Drawer,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  EmptyState,
  Field,
  FilterChip,
  IconButton,
  Input,
  List,
  ListRow,
  MediaCard,
  Navigator,
  PageHeader,
  Pagination,
  ProgressRing,
  ScrollArea,
  Select,
  Stepper,
  Switch,
  Tag,
  Timeline,
  TimelineItem,
  ToastProvider,
  useToast,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { ScenePlaceholder } from "./_shared/Placeholders";
import { MoreIcon } from "./_shared/ResourceIcons";

/**
 * 用分页、媒体卡、时间线这一批控件搭一个列表页。文案与数据全部虚构。
 * 顶上是页头；排序是下拉选择，"更多"是下拉菜单；页面窄的时候类别筛选收进抽屉；侧栏里的日程限了高，在滚动区里滚。
 */
const meta = {
  title: "示例/列表页",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const zones = ["谷地", "第七勘探区", "荒原"];
const categories = ["新闻", "公告", "影像"];
const subjects = [
  "首批测绘数据归档",
  "补给站扩建进入第二阶段",
  "排水泵检修记录",
  "路线比对结果公布",
  "采样点渗水处理",
  "秋季计划征集建议",
  "夜间值守安排调整",
];

const orders = [
  { value: "newest", label: "最新在前" },
  { value: "oldest", label: "最早在前" },
];

const pad = (value: number) => String(value).padStart(2, "0");

const records = Array.from({ length: 28 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 9, 8 - index));
  const day = `${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())}`;
  const zone = zones[index % zones.length]!;
  return {
    id: index,
    // 相邻两行错开一格，同一列上下两张不会是同一幅占位图
    seed: index + Math.floor(index / 3),
    zone,
    category: categories[(index * 2 + (index % 5 === 0 ? 1 : 0)) % 3]!,
    title: `${zone} · ${subjects[index % subjects.length]}`,
    day,
    date: `${date.getUTCFullYear()}.${day}`,
    archived: index > 7,
  };
});

function Label({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 font-tech text-xs text-ink-secondary">
      <span aria-hidden="true">{"// "}</span>
      {children}
    </h2>
  );
}

function Archive() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  // 导航器的第 0 项是"全部"
  const [zoneIndex, setZoneIndex] = useState(0);
  const [asList, setAsList] = useState(false);
  const [pageSize, setPageSize] = useState(6);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState("newest");
  const [hideArchived, setHideArchived] = useState(false);

  const zone = zoneIndex === 0 ? null : zones[zoneIndex - 1];
  const keyword = query.trim();
  const filtered = records.filter(
    (record) =>
      (zone === null || record.zone === zone) &&
      (picked.length === 0 || picked.includes(record.category)) &&
      !(hideArchived && record.archived) &&
      (keyword === "" || record.title.includes(keyword)),
  );
  // 数据本来就是从新到旧排的
  const matched = order === "newest" ? filtered : [...filtered].reverse();

  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = matched.slice((current - 1) * pageSize, current * pageSize);
  const archived = records.filter((record) => record.archived).length;

  // 筛选条件一变就回到第一页
  const refilter = (change: () => void) => {
    change();
    setPage(1);
  };

  const reset = () =>
    refilter(() => {
      setQuery("");
      setPicked([]);
      setHideArchived(false);
      setZoneIndex(0);
    });

  // 宽的时候排在工具条里，窄的时候收进抽屉：同一组胶囊
  const categoryChips = (
    <div className="flex min-h-10 flex-wrap items-center gap-2">
      {categories.map((category) => (
        <FilterChip
          key={category}
          selected={picked.includes(category)}
          onSelectedChange={(selected) =>
            refilter(() =>
              setPicked(
                selected
                  ? [...picked, category]
                  : picked.filter((item) => item !== category),
              ),
            )
          }
        >
          {category}
        </FilterChip>
      ))}
    </div>
  );

  return (
    <div className="@container mx-auto flex max-w-5xl flex-col gap-10">
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem href="#station">站点</BreadcrumbItem>
            <BreadcrumbItem href="#seventh">第七勘探队</BreadcrumbItem>
            <BreadcrumbItem current>档案</BreadcrumbItem>
          </Breadcrumb>
        }
        meta={`// ARCHIVE　共 ${records.length} 条`}
        title="档案"
        description="按站点和月份归档的现场记录。"
      />

      {/* 凹陷底色的工具条里，输入框换成四边描边 */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 bg-surface-sunken p-4">
        <Field label="检索" className="min-w-48 flex-1">
          <Input
            variant="outline"
            type="search"
            placeholder="标题里的关键词"
            value={query}
            onChange={(event) => refilter(() => setQuery(event.target.value))}
          />
        </Field>
        <Field label="排序" className="w-36">
          <Select
            variant="outline"
            items={orders}
            value={order}
            onValueChange={(next) => refilter(() => setOrder(next))}
          />
        </Field>
        <Field group label="类别" className="hidden @2xl:block">
          {categoryChips}
        </Field>
        {/* 页面窄的时候类别收进抽屉；按钮上写出选了几个 */}
        <div className="@2xl:hidden">
          <Drawer
            accent
            trigger={
              <Button variant="light">
                {picked.length === 0 ? "筛选" : `筛选 · ${picked.length}`}
              </Button>
            }
            title="筛选"
            footer={
              <>
                <DialogClose>
                  <Button variant="light" onClick={reset}>
                    清除筛选
                  </Button>
                </DialogClose>
                <DialogClose>
                  <Button>完成</Button>
                </DialogClose>
              </>
            }
          >
            <Field group label="类别">
              {categoryChips}
            </Field>
          </Drawer>
        </div>
        <Switch
          aria-label="列表视图"
          offLabel="网格"
          onLabel="列表"
          checked={asList}
          onCheckedChange={setAsList}
        />
      </div>

      <div className="grid gap-x-12 gap-y-10 @3xl:grid-cols-[minmax(0,1fr)_15rem]">
        <main className="@container flex min-w-0 flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <p role="status" className="text-sm text-ink-secondary">
              {`共 ${matched.length} 条记录`}
              {zone !== null && `，${zone}`}
            </p>
            <DropdownMenu
              align="end"
              trigger={
                <IconButton size="sm" aria-label="更多操作">
                  <MoreIcon />
                </IconButton>
              }
            >
              {/* 能开能关的设置是复选项：勾了不关菜单，可以连着改 */}
              <DropdownMenuGroup label="显示">
                <DropdownMenuCheckboxItem
                  checked={asList}
                  onCheckedChange={setAsList}
                >
                  列表视图
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={hideArchived}
                  onCheckedChange={(next) =>
                    refilter(() => setHideArchived(next))
                  }
                >
                  隐藏已归档
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuSub label="导出为" disabled={matched.length === 0}>
                {["表格（CSV）", "纯文本"].map((format) => (
                  <DropdownMenuItem
                    key={format}
                    onClick={() =>
                      toast({
                        message: `已把 ${matched.length} 条记录导出为${format}`,
                        tone: "success",
                      })
                    }
                  >
                    {format}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => toast("检索条件的链接已复制")}>
                复制链接
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={reset}>清除筛选</DropdownMenuItem>
            </DropdownMenu>
          </div>

          {matched.length === 0 ? (
            <EmptyState
              bordered
              title="没有符合条件的记录"
              description="换一个关键词，或者去掉几个筛选条件再试。"
              action={
                <Button variant="light" onClick={reset}>
                  清除筛选
                </Button>
              }
            />
          ) : asList ? (
            <List aria-label="档案">
              {visible.map((record) => (
                <ListRow
                  key={record.id}
                  href="#record"
                  start={
                    <Tag variant="inverse" numeric>
                      {record.day}
                    </Tag>
                  }
                  end={record.category}
                  description={record.archived ? "已归档" : "待复核"}
                >
                  {record.title}
                </ListRow>
              ))}
            </List>
          ) : (
            <div className="grid gap-x-6 gap-y-8 @sm:grid-cols-2 @2xl:grid-cols-3">
              {visible.map((record) => (
                <MediaCard
                  key={record.id}
                  href="#record"
                  media={<ScenePlaceholder seed={record.seed} />}
                  title={record.title}
                  category={record.category}
                  date={record.date}
                  // 影像：封面左下角多一个播放记号
                  video={record.category === "影像"}
                  tag={
                    record.category === "影像" ? (
                      <Tag size="sm">PV</Tag>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}

          <Pagination
            page={current}
            pageCount={pageCount}
            onPageChange={setPage}
            jump
          />
        </main>

        <aside className="flex min-w-0 flex-col gap-8">
          <section>
            <Label>勘探区</Label>
            <div className="flex flex-col items-start gap-3">
              <Navigator
                size="sm"
                loop
                aria-label="勘探区"
                items={["全部", ...zones]}
                index={zoneIndex}
                onIndexChange={(next) => refilter(() => setZoneIndex(next))}
              />
              {/* 位置已经由导航器播报，短横只是给眼睛看的 */}
              <DashIndicator
                count={zones.length + 1}
                index={zoneIndex}
                aria-hidden="true"
              />
            </div>
          </section>

          <section>
            <Label>归档进度</Label>
            <div className="flex items-center gap-4">
              <ProgressRing
                size={64}
                value={archived}
                max={records.length}
                showValue
                aria-label="归档进度"
              />
              <p className="text-sm text-ink-secondary">
                已归档
                <span className="mx-1 font-tech text-base font-bold text-ink tabular-nums">
                  {`${archived} / ${records.length}`}
                </span>
                条
              </p>
            </div>
          </section>

          <Field label="每页条数" help="3 – 9 条，每次加减 3 条。">
            <Stepper
              value={pageSize}
              onValueChange={(next) => refilter(() => setPageSize(next))}
              min={3}
              max={9}
              step={3}
            />
          </Field>

          <section>
            <Label>日程</Label>
            {/* 日程越排越长：限高，里面自己滚。滚动条是画出来的那一种 */}
            <ScrollArea aria-label="日程" className="max-h-56">
              <Timeline aria-label="日程">
                <TimelineItem date="09.24" title="第七勘探区立项" />
                <TimelineItem date="09.28" title="信标到货，共四十枚" />
                <TimelineItem date="10.02" title="首批测绘数据归档" />
                <TimelineItem status="current" date="10.08" title="补给站扩建">
                  第二阶段施工中。
                </TimelineItem>
                <TimelineItem
                  status="upcoming"
                  date="10.14"
                  title="管廊北段复测"
                />
                <TimelineItem
                  status="upcoming"
                  date="10.21"
                  title="终端停机维护"
                />
                <TimelineItem
                  status="upcoming"
                  date="10.26"
                  title="第三岩层采样"
                />
                <TimelineItem
                  status="upcoming"
                  date="10.31"
                  title="月度归档截止"
                />
              </Timeline>
            </ScrollArea>
          </section>
        </aside>
      </div>
    </div>
  );
}

export const Page: Story = {
  name: "档案",
  render: () => (
    <ToastProvider>
      <Archive />
    </ToastProvider>
  ),
};
