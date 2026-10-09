import {
  ContextMenu,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  IconButton,
  Kbd,
  Lock,
  Plus,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { LinkIcon, MoreIcon, PrintIcon } from "./_shared/ResourceIcons";
import { shipments } from "./_shared/shipments";
import { stationLabel } from "./_shared/stations";

/* 文案与数据全部虚构 */
const items = (
  <>
    <DropdownMenuGroup label="条目">
      <DropdownMenuItem iconStart={<Plus />}>复制一份</DropdownMenuItem>
      <DropdownMenuItem iconStart={<Lock />} end={<Kbd size="sm">L</Kbd>}>
        锁定
      </DropdownMenuItem>
      <DropdownMenuItem disabled>移动到…</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem tone="danger">销毁</DropdownMenuItem>
  </>
);

const area = (
  <div className="flex h-40 max-w-md items-center justify-center border border-dashed border-line-strong bg-surface-sunken text-sm text-ink-secondary select-none">
    在这块区域上点右键
  </div>
);

const meta = {
  title: "控件/ContextMenu 右键菜单",
  component: ContextMenu,
  args: {
    variant: "plain",
    disabled: false,
    menu: items,
    children: area,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["plain", "strong"] },
    menu: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Strong: Story = {
  name: "固定深色的面板",
  args: { variant: "strong" },
};

/*
 * 右键菜单只是捷径：同样的操作在行尾的"更多"里也有。
 * 触屏上长按、键盘上先把焦点移到这一行的按钮再按菜单键，都能打开
 */
function RowsWithMenu() {
  const rows = shipments.slice(0, 5);
  const [pinned, setPinned] = useState<ReadonlySet<string>>(() => new Set());
  const [last, setLast] = useState("还没有操作");

  const menu = (id: string) => (
    <>
      <DropdownMenuItem
        iconStart={<LinkIcon />}
        onClick={() => setLast(`复制了 ${id} 的链接`)}
      >
        复制链接
      </DropdownMenuItem>
      <DropdownMenuItem
        iconStart={<PrintIcon />}
        onClick={() => setLast(`打印了 ${id} 的单据`)}
      >
        打印单据
      </DropdownMenuItem>
      <DropdownMenuCheckboxItem
        checked={pinned.has(id)}
        onCheckedChange={(checked) =>
          setPinned((current) => {
            const next = new Set(current);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          })
        }
      >
        置顶
      </DropdownMenuCheckboxItem>
      <DropdownMenuSub label="改派到">
        <DropdownMenuItem onClick={() => setLast(`${id} 改派到北区`)}>
          北区
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLast(`${id} 改派到南岸`)}>
          南岸
        </DropdownMenuItem>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem tone="danger" onClick={() => setLast(`撤回了 ${id}`)}>
        撤回
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <Table label="运输批次" headerVariant="muted">
        <TableHead>
          <TableRow>
            <TableHeaderCell>批次</TableHeaderCell>
            <TableHeaderCell>物资</TableHeaderCell>
            <TableHeaderCell>目的站</TableHeaderCell>
            <TableHeaderCell align="end">操作</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <ContextMenu key={row.id} menu={menu(row.id)}>
              <TableRow selected={pinned.has(row.id)}>
                <TableCell rowHeader className="font-tech">
                  {row.id}
                </TableCell>
                <TableCell>{row.cargo}</TableCell>
                <TableCell>{stationLabel(row.station)}</TableCell>
                <TableCell align="end">
                  <DropdownMenu
                    align="end"
                    trigger={
                      <IconButton size="sm" aria-label={`${row.id} 的更多操作`}>
                        <MoreIcon />
                      </IconButton>
                    }
                  >
                    {menu(row.id)}
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </ContextMenu>
          ))}
        </TableBody>
      </Table>
      <p role="status" className="text-sm text-ink-secondary">
        {last}
      </p>
    </div>
  );
}

export const Rows: Story = {
  name: "表格的每一行",
  parameters: { controls: { disable: true } },
  render: () => <RowsWithMenu />,
};
