import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Field,
  Input,
  Minus,
  Plus,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarToggle,
  ToolbarToggleGroup,
  Tooltip,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  BeaconIcon,
  DenseRowsIcon,
  DownloadIcon,
  ExpandIcon,
  LayersIcon,
  LinkIcon,
  PrintIcon,
  RouteIcon,
  RowsIcon,
  RuleIcon,
} from "./_shared/ResourceIcons";

/* 文案全部虚构；图标是原创的几何图形 */
const meta = {
  title: "控件/Toolbar 工具栏",
  component: Toolbar,
  args: {
    "aria-label": "表格工具",
    size: "md",
    variant: "sunken",
    orientation: "horizontal",
    disabled: false,
    children: (
      <>
        <ToolbarToggleGroup aria-label="行高" defaultValue={["md"]}>
          <ToolbarToggle value="md" icon={<RowsIcon />}>
            标准
          </ToolbarToggle>
          <ToolbarToggle value="sm" icon={<DenseRowsIcon />}>
            紧凑
          </ToolbarToggle>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarToggle icon={<RuleIcon />} aria-label="每五行加重一条线" />
        <ToolbarButton icon={<ExpandIcon />} aria-label="全部展开" />
        <ToolbarSeparator />
        <ToolbarButton icon={<PrintIcon />}>打印</ToolbarButton>
      </>
    ),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["sunken", "outline"] },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
    children: { control: false },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "两档尺寸",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(["sm", "md"] as const).map((size) => (
        <Toolbar key={size} aria-label={`单据工具（${size}）`} size={size}>
          <ToolbarButton icon={<LinkIcon />} aria-label="复制链接" />
          <ToolbarButton icon={<PrintIcon />} aria-label="打印单据" />
          <ToolbarSeparator />
          <ToolbarToggle icon={<RuleIcon />} defaultPressed>
            加重线
          </ToolbarToggle>
          <ToolbarButton icon={<DownloadIcon />}>导出</ToolbarButton>
        </Toolbar>
      ))}
    </div>
  ),
};

/* 带子和输入框同高：并排时对得齐。凹陷底色的区域里换成描边 */
export const Outline: Story = {
  name: "描边（放在凹陷底色的区域里）",
  render: () => (
    <div className="flex flex-wrap items-end gap-4 bg-surface-sunken p-4">
      <Field label="检索" className="min-w-40 flex-1">
        <Input variant="outline" placeholder="批次号" />
      </Field>
      <Toolbar aria-label="表格工具" variant="outline">
        <ToolbarToggleGroup aria-label="行高" defaultValue={["md"]}>
          <ToolbarToggle value="md">标准</ToolbarToggle>
          <ToolbarToggle value="sm">紧凑</ToolbarToggle>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton icon={<DownloadIcon />} aria-label="导出" />
      </Toolbar>
    </div>
  ),
};

function TogglesExample() {
  const [density, setDensity] = useState(["md"]);
  const [layers, setLayers] = useState(["route", "beacon"]);
  const [ruled, setRuled] = useState(false);

  return (
    <div className="flex flex-col items-start gap-4">
      <Toolbar aria-label="显示">
        {/* 默认同时只按下一个；再点一次弹起来，可以一个都不按 */}
        <ToolbarToggleGroup
          aria-label="行高"
          value={density}
          onValueChange={setDensity}
        >
          <ToolbarToggle value="md">标准</ToolbarToggle>
          <ToolbarToggle value="sm">紧凑</ToolbarToggle>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        {/* multiple：可以同时按下几个 */}
        <ToolbarToggleGroup
          aria-label="图层"
          multiple
          value={layers}
          onValueChange={setLayers}
        >
          <ToolbarToggle value="route" icon={<RouteIcon />} aria-label="路线" />
          <ToolbarToggle
            value="beacon"
            icon={<BeaconIcon />}
            aria-label="信标"
          />
          <ToolbarToggle
            value="contour"
            icon={<LayersIcon />}
            aria-label="等高线"
          />
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        {/* 单独的一个开关钮 */}
        <ToolbarToggle
          icon={<RuleIcon />}
          pressed={ruled}
          onPressedChange={setRuled}
        >
          加重线
        </ToolbarToggle>
      </Toolbar>
      <p role="status" className="font-tech text-xs text-ink-secondary">
        {`// 行高 ${density.join("、") || "没选"}　图层 ${layers.join("、") || "没选"}　加重线 ${ruled ? "开" : "关"}`}
      </p>
    </div>
  );
}

export const Toggles: Story = {
  name: "开关钮：单个、一组只按一个、一组按几个",
  render: () => <TogglesExample />,
};

function WithOverlaysExample() {
  const [last, setLast] = useState("还没点");
  return (
    <div className="flex flex-col items-start gap-4">
      <Toolbar aria-label="单据工具">
        <Tooltip content="复制这一页的链接">
          <ToolbarButton
            icon={<LinkIcon />}
            aria-label="复制链接"
            onClick={() => setLast("复制链接")}
          />
        </Tooltip>
        <ToolbarButton icon={<PrintIcon />} onClick={() => setLast("打印")}>
          打印
        </ToolbarButton>
        <ToolbarSeparator />
        {/* 菜单的触发钮也是工具栏里的一项：方向键走得到，开着的时候保持按下的样子 */}
        <DropdownMenu
          trigger={<ToolbarButton icon={<DownloadIcon />}>导出</ToolbarButton>}
        >
          <DropdownMenuItem onClick={() => setLast("导出为表格")}>
            导出为表格
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLast("导出为文本")}>
            导出为文本
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLast("只导出选中的")}>
            只导出选中的
          </DropdownMenuItem>
        </DropdownMenu>
      </Toolbar>
      <p role="status" className="font-tech text-xs text-ink-secondary">
        {`// ${last}`}
      </p>
    </div>
  );
}

export const WithOverlays: Story = {
  name: "和菜单、文字提示一起用",
  render: () => <WithOverlaysExample />,
};

export const States: Story = {
  name: "状态：禁用一个、禁用一组、整条禁用",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Toolbar aria-label="禁用一个">
        <ToolbarButton icon={<PrintIcon />}>打印</ToolbarButton>
        <ToolbarButton icon={<DownloadIcon />} disabled>
          导出
        </ToolbarButton>
        <ToolbarToggle icon={<RuleIcon />} aria-label="加重线" defaultPressed />
      </Toolbar>
      <Toolbar aria-label="禁用一组">
        <ToolbarGroup aria-label="单据" disabled>
          <ToolbarButton icon={<PrintIcon />}>打印</ToolbarButton>
          <ToolbarButton icon={<DownloadIcon />}>导出</ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarToggle icon={<RuleIcon />} aria-label="加重线" />
      </Toolbar>
      <Toolbar aria-label="整条禁用" disabled>
        <ToolbarToggleGroup aria-label="行高" defaultValue={["md"]}>
          <ToolbarToggle value="md">标准</ToolbarToggle>
          <ToolbarToggle value="sm">紧凑</ToolbarToggle>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton icon={<PrintIcon />}>打印</ToolbarButton>
      </Toolbar>
    </div>
  ),
};

/* 竖排：方向键换成上下，分隔变成横线 */
export const Vertical: Story = {
  name: "竖排",
  render: () => (
    <Toolbar aria-label="地图工具" orientation="vertical">
      <ToolbarButton icon={<Plus />} aria-label="放大" />
      <ToolbarButton icon={<Minus />} aria-label="缩小" />
      <ToolbarSeparator />
      <ToolbarToggleGroup aria-label="图层" multiple defaultValue={["route"]}>
        <ToolbarToggle value="route" icon={<RouteIcon />} aria-label="路线" />
        <ToolbarToggle value="beacon" icon={<BeaconIcon />} aria-label="信标" />
        <ToolbarToggle
          value="contour"
          icon={<LayersIcon />}
          aria-label="等高线"
        />
      </ToolbarToggleGroup>
    </Toolbar>
  ),
};

export const Links: Story = {
  name: "链接形态",
  render: () => (
    <Toolbar aria-label="单据工具">
      <ToolbarButton icon={<PrintIcon />}>打印</ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton href="#archive">去档案</ToolbarButton>
      <ToolbarButton href="#help" icon={<LinkIcon />} aria-label="帮助" />
      <ToolbarButton href="#closed" disabled>
        旧版入口
      </ToolbarButton>
    </Toolbar>
  ),
};

export const Narrow: Story = {
  name: "窄容器里换行",
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <Toolbar aria-label="表格工具">
        <ToolbarToggleGroup aria-label="行高" defaultValue={["md"]}>
          <ToolbarToggle value="md">标准</ToolbarToggle>
          <ToolbarToggle value="sm">紧凑</ToolbarToggle>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton icon={<PrintIcon />}>打印</ToolbarButton>
        <ToolbarButton icon={<DownloadIcon />}>导出</ToolbarButton>
        <ToolbarButton icon={<LinkIcon />}>复制链接</ToolbarButton>
      </Toolbar>
    </div>
  ),
};
