import {
  Button,
  Checkbox,
  EmptyState,
  IconButton,
  Sparkline,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  type TableSortDirection,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { LinkIcon, PrintIcon } from "./_shared/ResourceIcons";
import { shipments, type Shipment } from "./_shared/shipments";
import { stationLabel } from "./_shared/stations";

/* 文案与数据全部虚构 */
const meta = {
  title: "控件/Table 表格",
  component: Table,
  args: {
    label: "运输批次",
    headerVariant: "band",
    size: "md",
    stickyFirstColumn: false,
    stickyHeader: false,
    ruled: false,
  },
  argTypes: {
    headerVariant: { control: "inline-radio", options: ["band", "muted"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    children: { control: false },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = shipments.slice(0, 6);

const head = (
  <TableHead>
    <TableRow>
      <TableHeaderCell>批次</TableHeaderCell>
      <TableHeaderCell>物资</TableHeaderCell>
      <TableHeaderCell>目的站</TableHeaderCell>
      <TableHeaderCell numeric>件数</TableHeaderCell>
      <TableHeaderCell numeric>载重（吨）</TableHeaderCell>
    </TableRow>
  </TableHead>
);

const cells = (row: Shipment) => (
  <>
    <TableCell rowHeader className="font-tech">
      {row.id}
    </TableCell>
    <TableCell>{row.cargo}</TableCell>
    <TableCell>{stationLabel(row.station)}</TableCell>
    <TableCell numeric>{row.count}</TableCell>
    <TableCell numeric>{row.weight.toFixed(1)}</TableCell>
  </>
);

export const Playground: Story = {
  render: (args) => (
    <Table {...args}>
      {head}
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>{cells(row)}</TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

type SortKey = "id" | "cargo" | "count" | "weight";

function SortableTable() {
  const [sort, setSort] = useState<{
    key: SortKey;
    direction: TableSortDirection;
  }>({ key: "count", direction: "descending" });

  const sorted = useMemo(() => {
    const sign = sort.direction === "ascending" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      return (
        sign *
        (typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "zh"))
      );
    });
  }, [sort]);

  // 排序的状态自己拿着：表头只告诉你"这一列该换成哪个方向"
  const column = (key: SortKey) => ({
    sort: sort.key === key ? sort.direction : null,
    onSort: (direction: TableSortDirection) => setSort({ key, direction }),
  });

  return (
    <Table label="运输批次">
      <TableHead>
        <TableRow>
          <TableHeaderCell {...column("id")}>批次</TableHeaderCell>
          <TableHeaderCell {...column("cargo")}>物资</TableHeaderCell>
          <TableHeaderCell>目的站</TableHeaderCell>
          <TableHeaderCell numeric {...column("count")}>
            件数
          </TableHeaderCell>
          <TableHeaderCell numeric {...column("weight")}>
            载重（吨）
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.id}>{cells(row)}</TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const Sortable: Story = {
  name: "排序",
  render: () => <SortableTable />,
};

function SelectableTable() {
  const [picked, setPicked] = useState<ReadonlySet<string>>(
    () => new Set([rows[1]!.id]),
  );
  const all = picked.size === rows.length;

  const toggle = (id: string, checked: boolean) =>
    setPicked((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      {/* 反转的表头是一个反转主题：里面的复选框按带子的底色取值 */}
      <Table label="运输批次">
        <TableHead>
          <TableRow>
            <TableHeaderCell className="w-10">
              <Checkbox
                aria-label="全选"
                checked={all}
                indeterminate={picked.size > 0 && !all}
                onCheckedChange={(checked) =>
                  setPicked(new Set(checked ? rows.map((row) => row.id) : []))
                }
              />
            </TableHeaderCell>
            <TableHeaderCell>批次</TableHeaderCell>
            <TableHeaderCell>物资</TableHeaderCell>
            <TableHeaderCell numeric>件数</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} selected={picked.has(row.id)}>
              <TableCell>
                <Checkbox
                  aria-label={`选中 ${row.id}`}
                  checked={picked.has(row.id)}
                  onCheckedChange={(checked) => toggle(row.id, checked)}
                />
              </TableCell>
              <TableCell rowHeader className="font-tech">
                {row.id}
              </TableCell>
              <TableCell>{row.cargo}</TableCell>
              <TableCell numeric>{row.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p role="status" className="text-sm text-ink-secondary">
        {`已选 ${picked.size} / ${rows.length}`}
      </p>
    </div>
  );
}

export const Selectable: Story = {
  name: "勾选",
  render: () => <SelectableTable />,
};

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

export const RichCells: Story = {
  name: "单元格里放别的控件",
  render: (args) => (
    <Table {...args}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>批次</TableHeaderCell>
          <TableHeaderCell>状态</TableHeaderCell>
          <TableHeaderCell className="w-32">近八次载重</TableHeaderCell>
          <TableHeaderCell numeric>载重（吨）</TableHeaderCell>
          <TableHeaderCell align="end">操作</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell rowHeader className="font-tech">
              {/* 整行不可点：要进详情，把名称写成链接 */}
              <a
                href="#shipment"
                className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {row.id}
              </a>
            </TableCell>
            <TableCell>{statusTag(row.status)}</TableCell>
            <TableCell>
              <Sparkline
                data={row.trend}
                tone={row.status === "已延误" ? "danger" : "info"}
                className="h-6"
              />
            </TableCell>
            <TableCell numeric>{row.weight.toFixed(1)}</TableCell>
            {/* 行内操作：悬停或键盘聚焦到这一行才显示，触屏上常显 */}
            <TableCell reveal align="end">
              <IconButton size="sm" aria-label={`复制 ${row.id} 的链接`}>
                <LinkIcon />
              </IconButton>
              <IconButton size="sm" aria-label={`打印 ${row.id} 的单据`}>
                <PrintIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const MutedHeader: Story = {
  name: "浅表头与紧凑行",
  args: { headerVariant: "muted", size: "sm" },
  render: Playground.render,
};

export const Ruled: Story = {
  name: "每隔五行加重一条线",
  args: { ruled: true, size: "sm" },
  render: (args) => (
    <Table {...args}>
      {head}
      <TableBody>
        {shipments.slice(0, 12).map((row) => (
          <TableRow key={row.id}>{cells(row)}</TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/* 容器窄的时候表格在自己里面横向滚动；冻结第一列，滚的时候知道看的是哪一行 */
export const Sticky: Story = {
  name: "窄容器：横向滚动并冻结首列",
  args: { stickyFirstColumn: true },
  render: (args) => (
    <div className="max-w-80">
      <Table {...args}>
        {head}
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id} selected={index === 2}>
              {cells(row)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

/* 给容器一个高度上限，表身在里面纵向滚动，表头留在上沿 */
export const StickyHeader: Story = {
  name: "表头吸顶",
  args: { stickyHeader: true, size: "sm", className: "max-h-64" },
  render: (args) => (
    <Table {...args}>
      {head}
      <TableBody>
        {shipments.map((row) => (
          <TableRow key={row.id}>{cells(row)}</TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/* 两个方向都滚：左上角那一格压在冻结的列和吸顶的行之上 */
export const StickyBoth: Story = {
  name: "表头吸顶并冻结首列",
  args: {
    stickyHeader: true,
    stickyFirstColumn: true,
    headerVariant: "muted",
    size: "sm",
    className: "max-h-64",
  },
  render: (args) => (
    <div className="max-w-80">
      <Table {...args}>
        {head}
        <TableBody>
          {shipments.map((row) => (
            <TableRow key={row.id}>{cells(row)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const Empty: Story = {
  name: "没有数据",
  render: (args) => (
    <Table {...args}>
      {head}
      <TableBody>
        <TableRow>
          <TableCell colSpan={5} className="py-6 whitespace-normal">
            <EmptyState
              bordered={false}
              title="没有符合条件的批次"
              description="换一个站点，或者清掉筛选条件再试。"
              action={<Button variant="light">清除筛选</Button>}
            />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
