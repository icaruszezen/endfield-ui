import {
  BracketTitle,
  Button,
  Checkbox,
  Combobox,
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
  Sparkline,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  ToastProvider,
  TopBar,
  useToast,
  type TableSortDirection,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState, type ReactNode } from "react";
import { BrandMark } from "./_shared/BrandMark";
import {
  ArchiveIcon,
  CollapseIcon,
  CrateIcon,
  GridIcon,
  LinkIcon,
  MailIcon,
  PrintIcon,
  RouteIcon,
  ShareIcon,
  SlidersIcon,
} from "./_shared/ResourceIcons";
import { shipments, type Shipment } from "./_shared/shipments";
import { stationGroups, stationLabel } from "./_shared/stations";

/**
 * 用侧轨、顶栏、全屏菜单、表格、组合框搭一个带外壳的工具页。
 * 宽屏是侧轨；窄于 1024px 时换成顶栏 + 全屏菜单——是换一套，不是把侧轨缩小。
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

const sections = [
  { key: "overview", label: "总览", icon: GridIcon, group: null },
  { key: "dispatch", label: "调度", icon: RouteIcon, group: "作业" },
  { key: "depot", label: "仓库", icon: CrateIcon, group: "作业" },
  { key: "archive", label: "档案", icon: ArchiveIcon, group: "资料" },
  { key: "settings", label: "设置", icon: SlidersIcon, group: "资料" },
] as const;

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
  const [sort, setSort] = useState<{
    key: SortKey;
    direction: TableSortDirection;
  }>({ key: "id", direction: "ascending" });
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set());
  const [page, setPage] = useState(1);

  const matched = useMemo(() => {
    const sign = sort.direction === "ascending" ? 1 : -1;
    return rows
      .filter((row) => station === null || row.station === station)
      .sort((a, b) => {
        const left = a[sort.key];
        const right = b[sort.key];
        return (
          sign *
          (typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right)))
        );
      });
  }, [rows, station, sort]);

  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = matched.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const pickedHere = visible.filter((row) => picked.has(row.id)).length;

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
            {picked.size > 0 && `，已选 ${picked.size}`}
          </p>
        </div>

        {/* 第一列是勾选框加批次号：横向滚动时冻结它，滚到哪都知道看的是哪一行 */}
        <Table label="运输批次" stickyFirstColumn>
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
              <TableHeaderCell align="end">操作</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 whitespace-normal">
                  <EmptyState
                    bordered={false}
                    title="这个站没有在途的批次"
                    description="换一个站点，或者清掉筛选条件。"
                    action={
                      <Button variant="light" onClick={() => setStation(null)}>
                        清除筛选
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => (
              <TableRow key={row.id} selected={picked.has(row.id)}>
                <TableCell rowHeader>
                  <span className="flex items-center gap-3">
                    <Checkbox
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
                <TableCell reveal align="end">
                  <IconButton
                    size="sm"
                    aria-label={`复制 ${row.id} 的链接`}
                    onClick={() => toast(`已复制 ${row.id} 的链接`)}
                  >
                    <LinkIcon />
                  </IconButton>
                  <IconButton
                    size="sm"
                    aria-label={`打印 ${row.id} 的单据`}
                    onClick={() => toast(`${row.id} 的单据已送去打印`)}
                  >
                    <PrintIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
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
  const label = sections.find((item) => item.key === section)!.label;

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
        {["作业", "资料"].map((group) => (
          <SideRailGroup key={group} label={group}>
            {sections.filter((item) => item.group === group).map(railItem)}
          </SideRailGroup>
        ))}
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
          {sections.map(({ key, label, icon: Icon }) => (
            <NavMenuItem
              key={key}
              icon={<Icon />}
              current={key === section}
              onClick={() => onSection(key)}
            >
              {label}
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
