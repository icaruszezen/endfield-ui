import {
  BracketTitle,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  ButtonGroup,
  CompletionBanner,
  DataRow,
  DataRowList,
  Dialog,
  DialogClose,
  EmptyState,
  Field,
  GhostText,
  HazardStripe,
  ItemGrid,
  ItemSlot,
  Kbd,
  Panel,
  PanelBody,
  PanelHeader,
  PanelRow,
  PanelRows,
  Radio,
  RadioGroup,
  RegistrationStrip,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TickRing,
  ToastProvider,
  Tooltip,
  Viewfinder,
  useToast,
  type ItemSlotRarity,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useState } from "react";
import { CrateIcon, FuelIcon, OreIcon } from "./_shared/ResourceIcons";

/**
 * 用物品格、楔形页签、角括号、取景角这一批游戏风格的控件搭一个仓库页。
 * 销毁要先过一个确认弹窗，完成后出一条可以撤销的轻提示。
 * 文案与数据全部虚构，图标是原创的几何图形。
 */
const meta = {
  title: "示例/仓库页",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Item = {
  id: string;
  name: string;
  count: number;
  rarity: ItemSlotRarity;
  icon: typeof OreIcon;
  /** 入库的先后，数字越大越新 */
  order: number;
  isNew?: boolean;
};

const stock: Item[] = [
  {
    id: "gravel",
    name: "碎石",
    count: 999,
    rarity: 1,
    icon: OreIcon,
    order: 1,
  },
  {
    id: "filter",
    name: "滤芯",
    count: 14,
    rarity: 1,
    icon: CrateIcon,
    order: 2,
  },
  {
    id: "alloy",
    name: "合金锭",
    count: 128,
    rarity: 2,
    icon: OreIcon,
    order: 3,
  },
  {
    id: "cell",
    name: "备用电池",
    count: 8,
    rarity: 2,
    icon: FuelIcon,
    order: 4,
  },
  {
    id: "coolant",
    name: "冷却液",
    count: 40,
    rarity: 2,
    icon: FuelIcon,
    order: 5,
  },
  {
    id: "fuel",
    name: "高能燃料",
    count: 36,
    rarity: 3,
    icon: FuelIcon,
    order: 6,
  },
  {
    id: "beacon",
    name: "定位信标",
    count: 1,
    rarity: 3,
    icon: FuelIcon,
    order: 7,
  },
  {
    id: "plate",
    name: "加固板材",
    count: 22,
    rarity: 3,
    icon: CrateIcon,
    order: 8,
  },
  {
    id: "crate",
    name: "密封货箱",
    count: 2,
    rarity: 4,
    icon: CrateIcon,
    order: 9,
    isNew: true,
  },
  {
    id: "core",
    name: "校准核心",
    count: 1,
    rarity: 4,
    icon: OreIcon,
    order: 10,
    isNew: true,
  },
];

/* 本周收支：虚构的数字。类目两种——结构件（紫）、耗材（青） */
const ledger = [
  {
    id: "alloy",
    name: "合金锭",
    category: "var(--color-special)",
    series: [42, 58, 51, 77, 69, 88, 80, 96],
    value: "+128",
    tone: "info",
    reference: "+140",
  },
  {
    id: "plate",
    name: "加固板材",
    category: "var(--color-special)",
    series: [64, 60, 71, 55, 62, 48, 57, 44],
    value: "−64",
    tone: "accent",
    reference: "−60",
  },
  {
    id: "fuel",
    name: "高能燃料",
    category: "var(--color-region)",
    series: [30, 52, 41, 66, 58, 83, 79, 97],
    value: "−212",
    tone: "danger",
    reference: "−180",
  },
] as const;

/** 图鉴里还没见过的条目：只有名称 */
const unseen = ["未登记的样本", "未登记的部件", "未登记的容器"];

const sorters = {
  recent: (a: Item, b: Item) => b.order - a.order,
  rarity: (a: Item, b: Item) => b.rarity - a.rarity || b.order - a.order,
  count: (a: Item, b: Item) => b.count - a.count,
} as const;

type Sort = keyof typeof sorters;

function Depot() {
  const toast = useToast();
  const [watched, setWatched] = useState(() => new Set(["alloy"]));
  const [items, setItems] = useState(stock);
  const [selectedId, setSelectedId] = useState<string | null>("alloy");
  const [locked, setLocked] = useState<ReadonlySet<string>>(
    () => new Set(["core"]),
  );
  const [sort, setSort] = useState<Sort>("recent");

  const sorted = useMemo(() => [...items].sort(sorters[sort]), [items, sort]);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const position = selected ? sorted.indexOf(selected) + 1 : 0;
  const isLocked = selected ? locked.has(selected.id) : false;

  const toggleLock = (id: string) =>
    setLocked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 键位提示写的是真的：按 L 锁定或解锁当前选中的物品
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "l" || !selectedId) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // 正在输入框里打字时不抢按键
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input:not([type=radio], [type=checkbox]), textarea")
      ) {
        return;
      }
      toggleLock(selectedId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  const discard = () => {
    if (!selected || isLocked) return;
    const removed = selected;
    // 选中移到下一格（没有就上一格），不让详情面板空下来
    const next = sorted[position] ?? sorted[position - 2] ?? null;
    setItems((current) => current.filter((item) => item.id !== removed.id));
    setSelectedId(next?.id ?? null);
    toast({
      message: `已销毁 ${removed.name}`,
      action: {
        label: "撤销",
        onClick: () => {
          setItems((current) => [...current, removed]);
          setSelectedId(removed.id);
        },
      },
    });
  };

  const SelectedIcon = selected?.icon;

  return (
    <div className="@container relative mx-auto flex max-w-5xl flex-col gap-8">
      {/* 巨字裁在自己的一层里：页面本身不裁切，焦点环和角括号才不会被切掉 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-clip"
      >
        <GhostText className="absolute -top-2 -right-6 hidden @3xl:block">
          //Depot
        </GhostText>
      </div>

      <header className="relative flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbItem href="#terminal">终端</BreadcrumbItem>
          <BreadcrumbItem href="#station">北区仓储站</BreadcrumbItem>
          <BreadcrumbItem current>仓库</BreadcrumbItem>
        </Breadcrumb>
        <div className="max-w-md">
          <BracketTitle level={1} className="text-3xl">
            仓库
          </BracketTitle>
          <RegistrationStrip rule className="mt-3" />
        </div>
      </header>

      <CompletionBanner
        title="本周盘点已完成"
        description={`${stock.length} 类物资全部核对`}
        action={<Button size="sm">查看报告</Button>}
      />

      <Tabs defaultValue="supply" variant="wedge">
        <TabList aria-label="仓库分类">
          <Tab value="supply">物资</Tab>
          <Tab value="gear">装备</Tab>
          <Tab value="index">图鉴</Tab>
        </TabList>

        <TabPanel value="supply" className="pt-6">
          <div className="grid gap-x-10 gap-y-8 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="flex min-w-0 flex-col gap-6">
              {/* 菱形符号的开关写在这一块上；真实项目里写在 <html> 上 */}
              <div data-choice="diamond">
                <Field group label="排列顺序（单选）">
                  <RadioGroup
                    orientation="horizontal"
                    value={sort}
                    onValueChange={(next) => setSort(next as Sort)}
                  >
                    <Radio value="recent">最近入库</Radio>
                    <Radio value="rarity">稀有度</Radio>
                    <Radio value="count">数量</Radio>
                  </RadioGroup>
                </Field>
              </div>

              {/* 整个矩阵只占一个 Tab 停靠点，进去之后用方向键走 */}
              <ItemGrid aria-label="物资">
                {sorted.map(({ icon: Icon, order: _order, ...item }) => (
                  <ItemSlot
                    key={item.id}
                    {...item}
                    locked={locked.has(item.id)}
                    selected={item.id === selectedId}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <Icon size={32} />
                  </ItemSlot>
                ))}
              </ItemGrid>
              <p className="-mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-secondary">
                <Kbd>←</Kbd>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <Kbd>→</Kbd>
                在格子之间移动
                <Kbd>Enter</Kbd>
                选中
              </p>

              <section className="flex flex-col gap-3">
                <h2 className="font-medium">本周收支</h2>
                <DataRowList
                  label="本周收支"
                  columns={{
                    name: "物资",
                    trend: "走势",
                    value: "当前",
                    reference: "理论",
                  }}
                >
                  {ledger.map((row) => (
                    <DataRow
                      key={row.id}
                      name={row.name}
                      categoryColor={row.category}
                      series={row.series}
                      value={row.value}
                      tone={row.tone}
                      reference={row.reference}
                      favorite={watched.has(row.id)}
                      favoriteLabel={`关注${row.name}`}
                      onFavoriteChange={(next) =>
                        setWatched((current) => {
                          const updated = new Set(current);
                          if (next) updated.add(row.id);
                          else updated.delete(row.id);
                          return updated;
                        })
                      }
                    />
                  ))}
                </DataRowList>
                <p className="text-sm text-ink-secondary">
                  蓝是产出，黄是消耗，红是超出了理论值；点行首的圆可以关注一项。
                </p>
              </section>
            </div>

            <aside className="flex min-w-0 flex-col gap-6">
              <Panel>
                <PanelHeader>物品详情</PanelHeader>
                {selected && SelectedIcon ? (
                  <>
                    {/* 读数都是真的：当前排列下的第几个、稀有度 */}
                    <Viewfinder
                      crosshair={false}
                      readouts={{
                        topLeft: `NO. ${String(position).padStart(2, "0")} / ${String(sorted.length).padStart(2, "0")}`,
                        bottomRight: `RARITY ${selected.rarity}`,
                      }}
                      className="flex justify-center px-6 py-10"
                    >
                      <TickRing size={144} ticks={32}>
                        <SelectedIcon size={56} />
                      </TickRing>
                    </Viewfinder>
                    <PanelRows>
                      <PanelRow label="名称">{selected.name}</PanelRow>
                      <PanelRow label="数量">{selected.count}</PanelRow>
                      <PanelRow label="状态">
                        {isLocked ? "已锁定" : "未锁定"}
                      </PanelRow>
                    </PanelRows>
                    <PanelBody>
                      <ButtonGroup aria-label="物品操作" gap="sm">
                        <Kbd>L</Kbd>
                        <Tooltip content="锁定的物品不会被销毁" side="bottom">
                          <Button
                            variant="light"
                            size="sm"
                            onClick={() => toggleLock(selected.id)}
                          >
                            {isLocked ? "解锁" : "锁定"}
                          </Button>
                        </Tooltip>
                        <Button size="sm">使用</Button>
                      </ButtonGroup>
                    </PanelBody>
                  </>
                ) : (
                  <EmptyState
                    bordered={false}
                    title="没有选中物品"
                    description="在左边的格子里选一个，这里会显示它的详情。"
                  />
                )}
              </Panel>

              <Panel>
                <HazardStripe size="sm" />
                <PanelBody>
                  <h2 className="font-medium">销毁物品</h2>
                  <p className="mt-1 text-sm text-ink-secondary">
                    销毁后无法恢复。已锁定的物品不能销毁。
                  </p>
                  <ButtonGroup className="mt-4" aria-label="销毁物品">
                    {/* 破坏性操作先确认：点遮罩不关，按钮文字里写明后果 */}
                    <Dialog
                      alert
                      size="sm"
                      trigger={
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={!selected || isLocked}
                        >
                          销毁所选
                        </Button>
                      }
                      title={`销毁${selected?.name ?? "物品"}`}
                      description={`仓库里的 ${selected?.count ?? 0} 件会全部销毁。`}
                      footer={
                        <>
                          <DialogClose>
                            <Button variant="light">取消</Button>
                          </DialogClose>
                          <DialogClose>
                            <Button variant="danger" onClick={discard}>
                              {`销毁 ${selected?.count ?? 0} 件`}
                            </Button>
                          </DialogClose>
                        </>
                      }
                    />
                  </ButtonGroup>
                </PanelBody>
              </Panel>
            </aside>
          </div>
        </TabPanel>

        <TabPanel value="gear" className="pt-6">
          <EmptyState
            title="暂无装备"
            description="完成一次外勤后，带回来的装备会出现在这里。"
          />
        </TabPanel>

        <TabPanel value="index" className="pt-6">
          <ItemGrid aria-label="图鉴">
            {stock.map(
              ({ icon: Icon, order: _order, isNew: _isNew, ...item }) => (
                <ItemSlot key={item.id} {...item} count={undefined}>
                  <Icon size={32} />
                </ItemSlot>
              ),
            )}
            {unseen.map((name) => (
              <ItemSlot key={name} name={name} unowned />
            ))}
          </ItemGrid>
          <p className="mt-4 text-sm text-ink-secondary">
            {`已登记 ${stock.length} / ${stock.length + unseen.length}`}
          </p>
        </TabPanel>
      </Tabs>
    </div>
  );
}

export const Page: Story = {
  name: "仓库",
  render: () => (
    <ToastProvider>
      <Depot />
    </ToastProvider>
  ),
};
