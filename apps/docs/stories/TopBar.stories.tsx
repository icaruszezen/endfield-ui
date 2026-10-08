import {
  IconButton,
  Menu,
  NavAction,
  NavMenu,
  NavMenuItem,
  TopBar,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { BrandMark } from "./_shared/BrandMark";
import {
  ArchiveIcon,
  ContrastIcon,
  CrateIcon,
  GridIcon,
  LinkIcon,
  RouteIcon,
  SlidersIcon,
} from "./_shared/ResourceIcons";

/* 文案全部虚构；标志和图标是原创的几何图形 */
const meta = {
  title: "控件/TopBar 顶栏与全屏菜单",
  component: TopBar,
  argTypes: {
    brand: { control: false },
    tools: { control: false },
    action: { control: false },
    menu: { control: false },
  },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const brand = (
  <a
    href="#home"
    className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
  >
    <BrandMark />
  </a>
);

const tools = (
  <IconButton aria-label="切换主题">
    <ContrastIcon />
  </IconButton>
);

const sections = [
  { key: "overview", label: "总览", icon: GridIcon },
  { key: "dispatch", label: "调度", icon: RouteIcon },
  { key: "archive", label: "档案", icon: ArchiveIcon },
  { key: "depot", label: "仓库", icon: CrateIcon },
  { key: "settings", label: "设置", icon: SlidersIcon },
] as const;

function SiteMenu({
  current = "dispatch",
  onNavigate,
  defaultOpen,
}: {
  current?: string;
  onNavigate?: (key: string) => void;
  defaultOpen?: boolean;
}) {
  return (
    <NavMenu
      defaultOpen={defaultOpen}
      trigger={
        <IconButton aria-label="打开菜单">
          <Menu />
        </IconButton>
      }
      title="菜单"
      brand={<BrandMark />}
      ghost="Seventh"
      tools={
        <>
          <IconButton aria-label="切换主题">
            <ContrastIcon />
          </IconButton>
          <IconButton aria-label="复制链接">
            <LinkIcon />
          </IconButton>
        </>
      }
      footer={<NavAction href="#console">前往控制台</NavAction>}
    >
      {sections.map(({ key, label, icon: Icon }) => (
        <NavMenuItem
          key={key}
          icon={<Icon />}
          href={`#${key}`}
          current={key === current}
          onClick={() => onNavigate?.(key)}
        >
          {label}
        </NavMenuItem>
      ))}
    </NavMenu>
  );
}

/* 顶栏默认贴在视口顶上。预览里装进一个定高、能滚动的框 */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="h-72 overflow-y-auto border border-line bg-surface-sunken">
      {children}
      <div className="flex flex-col gap-3 p-6">
        <p className="font-tech text-xs text-ink-tertiary">
          {"// 页面内容：往下滚，顶栏留在原处"}
        </p>
        {[72, 56, 64, 40, 68, 52, 60, 44, 70, 48].map((width, index) => (
          <div
            key={index}
            className="h-4 shrink-0 bg-surface-muted"
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* 只有顶栏：标志、工具、主行动。菜单钮见下一个 story */
export const Playground: Story = {
  render: (args) => (
    <Frame>
      <TopBar
        {...args}
        brand={brand}
        tools={tools}
        action={<NavAction href="#console">控制台</NavAction>}
      />
    </Frame>
  ),
};

function Navigating() {
  const [current, setCurrent] = useState("dispatch");
  return (
    <div className="max-w-md">
      <Frame>
        <TopBar
          brand={brand}
          action={<NavAction href="#console">控制台</NavAction>}
          menu={<SiteMenu current={current} onNavigate={setCurrent} />}
        />
      </Frame>
      <p role="status" className="mt-3 text-sm text-ink-secondary">
        {`当前栏目：${sections.find((section) => section.key === current)!.label}`}
      </p>
    </div>
  );
}

/* 菜单占整个视口，所以不并排：暗色用工具栏切 */
export const WithMenu: Story = {
  name: "带全屏菜单",
  parameters: { sideBySide: false },
  render: () => <Navigating />,
};

/* 默认打开，供截图核对。不进文档页 */
export const MenuOpen: Story = {
  name: "菜单打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  render: () => (
    <TopBar
      brand={brand}
      action={<NavAction href="#console">控制台</NavAction>}
      menu={<SiteMenu defaultOpen />}
    />
  ),
};
