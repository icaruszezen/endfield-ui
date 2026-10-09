import {
  BracketTitle,
  Button,
  Checkbox,
  Combobox,
  ContextMenu,
  DateRangePicker,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
  Field,
  FlyoutBar,
  FlyoutBarItem,
  IconButton,
  Menu,
  NavAction,
  NavMenu,
  NavMenuItem,
  Pagination,
  RegistrationStrip,
  SideRail,
  SideRailGroup,
  SideRailItem,
  SideRailSub,
  SideRailSubItem,
  Sparkline,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableExpander,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  ToastProvider,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggle,
  ToolbarToggleGroup,
  TopBar,
  useToast,
  type DateRange,
  type TableSize,
  type TableSortDirection,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState, type ReactNode } from "react";
import { BrandMark } from "./_shared/BrandMark";
import {
  ArchiveIcon,
  CollapseIcon,
  CrateIcon,
  DenseRowsIcon,
  DownloadIcon,
  ExpandIcon,
  GridIcon,
  LinkIcon,
  MailIcon,
  PrintIcon,
  RouteIcon,
  RowsIcon,
  RuleIcon,
  ShareIcon,
  SlidersIcon,
} from "./_shared/ResourceIcons";
import { ShipmentDetail } from "./_shared/ShipmentDetail";
import { shipments, type Shipment } from "./_shared/shipments";
import { stationGroups, stationLabel } from "./_shared/stations";

/**
 * 用侧轨、顶栏、全屏菜单、表格（行能展开）、工具栏、组合框、日期范围、右键菜单搭一个带外壳的工具页。
 * 宽屏是侧轨（"档案"带二级）；窄于 1024px 时换成顶栏 + 全屏菜单——是换一套，不是把侧轨缩小。
 * 文案与数据全部虚构，标志和图标是原创的几何图形。
 */
const meta = {
  title: "示例/调度台",
  // 这一页占整个视口：不并排、不进文档页，预览外壳也不给它加内边距
  tags: ["!autodocs"],
  parameters: {
    controls: { disable: true },
    sideBySide: false,
    bleed: true,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* parent 是它在侧轨里挂在哪个二级下面；全屏菜单是平的，写成"档案 · 人员" */
const sections = [
  { key: "overview", label: "总览", icon: GridIcon, group: null },
  { key: "dispatch", label: "调度", icon: RouteIcon, group: "作业" },
  { key: "depot", label: "仓库", icon: CrateIcon, group: "作业" },
  {
    key: "people",
    label: "人员",
    icon: ArchiveIcon,
    group: "资料",
    parent: "档案",
  },
  {
    key: "stations",
    label: "站点",
    icon: ArchiveIcon,
    group: "资料",
    parent: "档案",
  },
  { key: "settings", label: "设置", icon: SlidersIcon, group: "资料" },
] as const;

const fullLabel = (item: (typeof sections)[number]) =>
  "parent" in item ? `${item.parent} · ${item.label}` : item.label;

const TODAY = "2026-10-09";

type SectionKey = (typeof sections)[number]["key"];
type SortKey = "id" | "count" | "weight";

const PAGE_SIZE = 8;

const statusTag = (status: Shipment["status"]) =>
  status === "已延误" ? (
    <Tag size="sm" variant="inverse" marked>
      {status}
    </Tag>
  ) : (
    <Tag size="sm" variant={status === "运输中" ? "solid" : "outline"}>
      {status}
    </Tag>
  );

function Board() {
  const toast = useToast();
  const [rows, setRows] = useState(shipments);
  const [station, setStation] = useState<string | null>(null);
  const [dates, setDates] = useState<DateRange | null>(null);
  const [sort, setSort] = useState<{
    key: SortKey;
    direction: TableSortDirection;
  }>({ key: "id", direction: "ascending" });
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set());
  const [page, setPage] = useState(1);
  // 表格上面那条工具栏管的三样：行高、每五行的加重线、哪些行展开着
  const [density, setDensity] = useState<TableSize>("md");
  const [ruled, setRuled] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  const matched = useMemo(() => {
    const sign = sort.direction === "ascending" ? 1 : -1;
    return (
      rows
        .filter((row) => station === null || row.station === station)
        // 同一种写法的日期可以直接按字符串比大小；两头都算
        .filter(
          (row) =>
            dates === null || (row.date >= dates[0] && row.date <= dates[1]),
        )
        .sort((a, b) => {
          const left = a[sort.key];
          const right = b[sort.key];
          return (
            sign *
            (typeof left === "number" && typeof right === "number"
              ? left - right
              : String(left).localeCompare(String(right)))
          );
        })
    );
  }, [rows, station, dates, sort]);

  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = matched.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const pickedHere = visible.filter((row) => picked.has(row.id)).length;
  const allOpen =
    visible.length > 0 && visible.every((row) => open.has(row.id));

  const expand = (ids: string[], expanded: boolean) =>
    setOpen((before) => {
      const next = new Set(before);
      for (const id of ids) {
        if (expanded) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const column = (key: SortKey) => ({
    sort: sort.key === key ? sort.direction : null,
    onSort: (direction: TableSortDirection) => {
      setSort({ key, direction });
      setPage(1);
    },
  });

  const toggle = (ids: string[], checked: boolean) =>
    setPicked((before) => {
      const next = new Set(before);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const markArrived = () => {
    const count = picked.size;
    setRows((before) =>
      before.map((row) =>
        picked.has(row.id) ? { ...row, status: "已到站" } : row,
      ),
    );
    setPicked(new Set());
    toast({ message: `已把 ${count} 个批次标记为到站`, tone: "success" });
  };

  const copyLink = (id: string) => toast(`已复制 ${id} 的链接`);
  const print = (id: string) => toast(`${id} 的单据已送去打印`);
  const markOne = (id: string) => {
    setRows((before) =>
      before.map((row) => (row.id === id ? { ...row, status: "已到站" } : row)),
    );
    toast({ message: `${id} 已标记为到站`, tone: "success" });
  };

  // 右键菜单只是捷径：前两项行尾有按钮，"标记到站"勾选之后工具条里有
  const rowMenu = (row: Shipment) => (
    <>
      <DropdownMenuItem
        iconStart={<LinkIcon />}
        onClick={() => copyLink(row.id)}
      >
        复制链接
      </DropdownMenuItem>
      <DropdownMenuItem iconStart={<PrintIcon />} onClick={() => print(row.id)}>
        打印单据
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={row.status === "已到站"}
        onClick={() => markOne(row.id)}
      >
        标记到站
      </DropdownMenuItem>
    </>
  );

  const delayed = rows.filter((row) => row.status === "已延误").length;
  const moving = rows.filter((row) => row.status === "运输中").length;

  return (
    <div className="@container flex flex-col gap-8">
      <header className="flex flex-col gap-6">
        <div className="max-w-md">
          <BracketTitle level={1} className="text-3xl">
            调度台
          </BracketTitle>
          <RegistrationStrip rule className="mt-3" />
        </div>
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          <Stat label="IN TRANSIT" value={moving} unit="批" size="lg" />
          <Stat label="DELAYED" value={delayed} unit="批" />
          <Stat
            label="LOAD"
            value={rows.reduce((sum, row) => sum + row.count, 0)}
            unit="件"
          />
        </div>
      </header>

      {/* 凹陷底色的工具条里，组合框换成四边描边 */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 bg-surface-sunken p-4">
        {/* 二十几个站：打几个字就能找到，也可以输入编号（N-07） */}
        <Field label="目的站" className="min-w-56 flex-1">
          <Combobox
            variant="outline"
            items={stationGroups}
            placeholder="全部站点：输入站名或编号"
            value={station}
            onValueChange={(next) => {
              setStation(next);
              setPage(1);
            }}
          />
        </Field>
        <Field label="发车日期" className="w-64">
          <DateRangePicker
            variant="outline"
            placeholder="哪天都行"
            today={TODAY}
            min="2026-10-01"
            max="2026-10-31"
            value={dates}
            onValueChange={(next) => {
              setDates(next);
              setPage(1);
            }}
          />
        </Field>
        <Button
          variant="light"
          disabled={picked.size === 0}
          onClick={markArrived}
        >
          {picked.size === 0 ? "标记到站" : `标记到站 · ${picked.size}`}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Checkbox
            checked={visible.length > 0 && pickedHere === visible.length}
            indeterminate={pickedHere > 0 && pickedHere < visible.length}
            disabled={visible.length === 0}
            onCheckedChange={(checked) =>
              toggle(
                visible.map((row) => row.id),
                checked,
              )
            }
          >
            全选本页
          </Checkbox>
          <p role="status" className="text-sm text-ink-secondary">
            {`共 ${matched.length} 个批次`}
            {station !== null && `，${stationLabel(station)}`}
            {dates !== null &&
              `，${[...new Set(dates)]
                .map((date) => date.slice(5).replace("-", "."))
                .join(" 至 ")} 发车`}
            {picked.size > 0 && `，已选 ${picked.size}`}
          </p>
          {/* 一排作用于这张表的小工具：整条只占一个 Tab 停靠点 */}
          <Toolbar aria-label="表格工具" size="sm">
            {/* 行高是二选一：再点一次按下的那个，它不该弹起来，所以空的不收 */}
            <ToolbarToggleGroup
              aria-label="行高"
              value={[density]}
              onValueChange={(next) => {
                if (next[0] === "md" || next[0] === "sm") setDensity(next[0]);
              }}
            >
              <ToolbarToggle
                value="md"
                icon={<RowsIcon />}
                aria-label="标准行高"
              />
              <ToolbarToggle
                value="sm"
                icon={<DenseRowsIcon />}
                aria-label="紧凑行高"
              />
            </ToolbarToggleGroup>
            <ToolbarSeparator />
            <ToolbarToggle
              icon={<RuleIcon />}
              aria-label="每五行加重一条线"
              pressed={ruled}
              onPressedChange={setRuled}
            />
            <ToolbarButton
              icon={<ExpandIcon />}
              disabled={visible.length === 0}
              onClick={() =>
                expand(
                  visible.map((row) => row.id),
                  !allOpen,
                )
              }
            >
              {allOpen ? "全部收起" : "全部展开"}
            </ToolbarButton>
            <ToolbarSeparator />
            <DropdownMenu
              align="end"
              trigger={
                <ToolbarButton icon={<DownloadIcon />}>导出</ToolbarButton>
              }
            >
              <DropdownMenuItem
                onClick={() => toast(`已导出本页的 ${visible.length} 个批次`)}
              >
                导出本页
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={picked.size === 0}
                onClick={() => toast(`已导出选中的 ${picked.size} 个批次`)}
              >
                导出选中的
              </DropdownMenuItem>
            </DropdownMenu>
          </Toolbar>
        </div>

        {/* 第一列是勾选框加批次号：横向滚动时冻结它，滚到哪都知道看的是哪一行 */}
        <Table label="运输批次" stickyFirstColumn size={density} ruled={ruled}>
          <TableHead>
            <TableRow>
              <TableHeaderCell {...column("id")}>批次</TableHeaderCell>
              <TableHeaderCell>物资</TableHeaderCell>
              <TableHeaderCell>目的站</TableHeaderCell>
              <TableHeaderCell>状态</TableHeaderCell>
              <TableHeaderCell className="w-28">近八次载重</TableHeaderCell>
              <TableHeaderCell numeric {...column("count")}>
                件数
              </TableHeaderCell>
              <TableHeaderCell numeric {...column("weight")}>
                载重（吨）
              </TableHeaderCell>
              <TableHeaderCell>发车</TableHeaderCell>
              <TableHeaderCell align="end">操作</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-6 whitespace-normal">
                  <EmptyState
                    bordered={false}
                    title="没有符合条件的批次"
                    description="换一个站点或日期，或者清掉筛选条件。"
                    action={
                      <Button
                        variant="light"
                        onClick={() => {
                          setStation(null);
                          setDates(null);
                        }}
                      >
                        清除筛选
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => (
              // 每一行上点右键：和行尾那两个按钮是同一组操作
              <ContextMenu key={row.id} menu={rowMenu(row)}>
                {/* 一行下面压着装车明细：给行传 detail，名称前面放一个展开钮 */}
                <TableRow
                  selected={picked.has(row.id)}
                  detail={<ShipmentDetail row={row} />}
                  expanded={open.has(row.id)}
                  onExpandedChange={(expanded) => expand([row.id], expanded)}
                >
                  <TableCell rowHeader>
                    <span className="flex items-center gap-3">
                      <TableExpander aria-label={`${row.id} 的明细`} />
                      <Checkbox
                        // 复选框自带 40px 的点击区，会把行撑高：紧凑时收掉，行才矮得下来
                        className={
                          density === "sm" ? "min-h-0 py-0" : undefined
                        }
                        aria-label={`选中 ${row.id}`}
                        checked={picked.has(row.id)}
                        onCheckedChange={(checked) => toggle([row.id], checked)}
                      />
                      {/* 整行不可点：要进详情，把名称写成链接 */}
                      <a
                        href="#shipment"
                        className="font-tech underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {row.id}
                      </a>
                    </span>
                  </TableCell>
                  <TableCell>{row.cargo}</TableCell>
                  <TableCell>{stationLabel(row.station)}</TableCell>
                  <TableCell>{statusTag(row.status)}</TableCell>
                  <TableCell>
                    <Sparkline
                      data={row.trend}
                      tone={row.status === "已延误" ? "danger" : "info"}
                      className="h-6"
                    />
                  </TableCell>
                  <TableCell numeric>{row.count}</TableCell>
                  <TableCell numeric>{row.weight.toFixed(1)}</TableCell>
                  <TableCell className="font-tech tabular-nums">
                    {row.date.slice(5).replace("-", ".")}
                  </TableCell>
                  <TableCell reveal align="end">
                    <IconButton
                      size="sm"
                      aria-label={`复制 ${row.id} 的链接`}
                      onClick={() => copyLink(row.id)}
                    >
                      <LinkIcon />
                    </IconButton>
                    <IconButton
                      size="sm"
                      aria-label={`打印 ${row.id} 的单据`}
                      onClick={() => print(row.id)}
                    >
                      <PrintIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </ContextMenu>
            ))}
          </TableBody>
        </Table>

        <Pagination
          page={current}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

function Shell() {
  const [section, setSection] = useState<SectionKey>("dispatch");
  const [collapsed, setCollapsed] = useState(false);
  const label = fullLabel(sections.find((item) => item.key === section)!);

  const railItem = ({
    key,
    label: text,
    icon: Icon,
  }: (typeof sections)[number]) => (
    <SideRailItem
      key={key}
      icon={<Icon />}
      current={key === section}
      onClick={() => setSection(key)}
    >
      {text}
    </SideRailItem>
  );

  // 一组里的栏目：挂在二级下面的收成一个 SideRailSub，其余照常
  const railGroup = (group: string) => {
    const items = sections.filter((item) => item.group === group);
    const nested = items.filter((item) => "parent" in item);
    return (
      <SideRailGroup key={group} label={group}>
        {nested.length > 0 && (
          <SideRailSub icon={<ArchiveIcon />} label={nested[0]!.parent}>
            {nested.map((item) => (
              <SideRailSubItem
                key={item.key}
                current={item.key === section}
                onClick={() => setSection(item.key)}
              >
                {item.label}
              </SideRailSubItem>
            ))}
          </SideRailSub>
        )}
        {items.filter((item) => !("parent" in item)).map(railItem)}
      </SideRailGroup>
    );
  };

  const brand = (compact: boolean | "auto") => (
    <a
      href="#home"
      aria-label="第七勘探队 首页"
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <BrandMark compact={compact} />
    </a>
  );

  return (
    <div className="flex min-h-dvh bg-surface text-ink">
      {/* 宽屏：侧轨 */}
      <SideRail
        aria-label="主导航"
        collapsed={collapsed}
        className="hidden lg:flex"
        brand={brand(collapsed)}
        tools={
          <>
            <IconButton
              aria-label={collapsed ? "展开侧轨" : "收起侧轨"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            >
              <CollapseIcon className={collapsed ? "rotate-180" : undefined} />
            </IconButton>
            <FlyoutBar
              trigger={
                <IconButton variant="inverse" aria-label="分享">
                  <ShareIcon />
                </IconButton>
              }
            >
              <FlyoutBarItem aria-label="复制链接">
                <LinkIcon />
              </FlyoutBarItem>
              <FlyoutBarItem aria-label="发邮件">
                <MailIcon />
              </FlyoutBarItem>
            </FlyoutBar>
          </>
        }
        action={<NavAction href="#console">前往控制台</NavAction>}
        footer={<span className="font-tech">v0.1</span>}
      >
        {sections.filter((item) => item.group === null).map(railItem)}
        {["作业", "资料"].map(railGroup)}
      </SideRail>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 窄屏：顶栏 + 全屏菜单。栏目是同一份，状态也是同一个 */}
        <TopBarForNarrow
          brand={brand("auto")}
          section={section}
          onSection={setSection}
        />

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-12 lg:p-8">
          {section === "dispatch" ? (
            <Board />
          ) : (
            <EmptyState
              title={`"${label}"这一栏还是空的`}
              description="这个示例只做了调度这一栏。"
              action={
                <Button variant="light" onClick={() => setSection("dispatch")}>
                  回到调度
                </Button>
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}

function TopBarForNarrow({
  brand,
  section,
  onSection,
}: {
  brand: ReactNode;
  section: SectionKey;
  onSection: (key: SectionKey) => void;
}) {
  return (
    <TopBar
      className="lg:hidden"
      brand={brand}
      action={<NavAction href="#console">控制台</NavAction>}
      menu={
        <NavMenu
          trigger={
            <IconButton aria-label="打开菜单">
              <Menu />
            </IconButton>
          }
          title="菜单"
          brand={<BrandMark />}
          ghost="Seventh"
          tools={
            <IconButton aria-label="复制链接">
              <LinkIcon />
            </IconButton>
          }
          footer={<NavAction href="#console">前往控制台</NavAction>}
        >
          {sections.map((item) => (
            <NavMenuItem
              key={item.key}
              icon={<item.icon />}
              current={item.key === section}
              onClick={() => onSection(item.key)}
            >
              {fullLabel(item)}
            </NavMenuItem>
          ))}
        </NavMenu>
      }
    />
  );
}

export const Page: Story = {
  name: "调度台",
  render: () => (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  ),
};
