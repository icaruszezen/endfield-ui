import {
  Badge,
  FlyoutBar,
  FlyoutBarItem,
  IconButton,
  NavAction,
  SideRail,
  SideRailGroup,
  SideRailItem,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { BrandMark } from "./_shared/BrandMark";
import {
  ArchiveIcon,
  CollapseIcon,
  ContrastIcon,
  CrateIcon,
  GridIcon,
  LinkIcon,
  MailIcon,
  RouteIcon,
  ShareIcon,
  SlidersIcon,
} from "./_shared/ResourceIcons";
import { RouterLink } from "./_shared/RouterLink";

/* 文案全部虚构；标志和图标是原创的几何图形 */
const meta = {
  title: "控件/SideRail 侧轨",
  component: SideRail,
  args: { "aria-label": "主导航", collapsed: false, children: null },
  argTypes: {
    brand: { control: false },
    tools: { control: false },
    action: { control: false },
    footer: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof SideRail>;

export default meta;
type Story = StoryObj<typeof meta>;

/* 侧轨默认占满视口高。预览里把它装进一个定高的框，旁边放一块假的页面 */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[38rem] overflow-hidden border border-line">
      {children}
      <main className="min-w-0 flex-1 overflow-y-auto bg-surface-sunken p-6">
        <p className="font-tech text-xs text-ink-tertiary">{"// 页面内容"}</p>
        <div className="mt-4 flex flex-col gap-3">
          {[72, 56, 64, 40].map((width) => (
            <div
              key={width}
              className="h-4 bg-surface-muted"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

const items = (
  <>
    <SideRailItem icon={<GridIcon />} href="#overview">
      总览
    </SideRailItem>
    <SideRailItem icon={<RouteIcon />} href="#dispatch" current>
      调度
    </SideRailItem>
    <SideRailItem icon={<ArchiveIcon />} href="#archive">
      档案
    </SideRailItem>
    <SideRailItem icon={<CrateIcon />} href="#depot">
      仓库
    </SideRailItem>
    <SideRailItem icon={<SlidersIcon />} href="#settings" disabled>
      设置（未开放）
    </SideRailItem>
  </>
);

const share = (
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
);

const brandLink = (compact: boolean) => (
  <a
    href="#home"
    className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
  >
    <BrandMark compact={compact} />
  </a>
);

export const Playground: Story = {
  render: (args) => (
    <Frame>
      <SideRail
        {...args}
        className="h-full"
        brand={brandLink(args.collapsed ?? false)}
        tools={
          <>
            <IconButton aria-label="切换主题">
              <ContrastIcon />
            </IconButton>
            {share}
          </>
        }
        action={<NavAction href="#console">前往控制台</NavAction>}
        footer={<span className="font-tech">v0.1</span>}
      >
        {items}
      </SideRail>
    </Frame>
  ),
};

/* 收起：只有图标。悬停或键盘聚焦到一项，栏目名从它右边展开 */
export const Collapsed: Story = {
  name: "收起",
  args: { collapsed: true },
  render: Playground.render,
};

function Toggling() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Frame>
      <SideRail
        aria-label="主导航"
        collapsed={collapsed}
        className="h-full"
        brand={brandLink(collapsed)}
        tools={
          <IconButton
            aria-label={collapsed ? "展开侧轨" : "收起侧轨"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            <CollapseIcon className={collapsed ? "rotate-180" : undefined} />
          </IconButton>
        }
        action={<NavAction href="#console">前往控制台</NavAction>}
      >
        {items}
      </SideRail>
    </Frame>
  );
}

export const Toggle: Story = {
  name: "展开与收起",
  render: () => <Toggling />,
};

/* 栏目多的时候分组；行尾可以放计数 */
export const Groups: Story = {
  name: "分组与计数",
  render: (args) => (
    <Frame>
      <SideRail {...args} className="h-full" brand={brandLink(false)}>
        <SideRailItem icon={<GridIcon />} href="#overview" current>
          总览
        </SideRailItem>
        <SideRailGroup label="作业">
          <SideRailItem
            icon={<RouteIcon />}
            href="#dispatch"
            end={<Badge count={12} aria-label="12 个待处理" />}
          >
            调度
          </SideRailItem>
          <SideRailItem icon={<CrateIcon />} href="#depot">
            仓库
          </SideRailItem>
        </SideRailGroup>
        <SideRailGroup label="资料">
          <SideRailItem icon={<ArchiveIcon />} href="#archive">
            档案
          </SideRailItem>
          <SideRailItem icon={<SlidersIcon />} href="#settings">
            设置
          </SideRailItem>
        </SideRailGroup>
      </SideRail>
    </Frame>
  ),
};

export const GroupsCollapsed: Story = {
  name: "分组收起时",
  args: { collapsed: true },
  render: (args) => (
    <Frame>
      <SideRail {...args} className="h-full" brand={brandLink(true)}>
        <SideRailGroup label="作业">
          <SideRailItem icon={<RouteIcon />} href="#dispatch" current>
            调度
          </SideRailItem>
          <SideRailItem icon={<CrateIcon />} href="#depot">
            仓库
          </SideRailItem>
        </SideRailGroup>
        <SideRailGroup label="资料">
          <SideRailItem icon={<ArchiveIcon />} href="#archive">
            档案
          </SideRailItem>
          <SideRailItem icon={<SlidersIcon />} href="#settings">
            设置
          </SideRailItem>
        </SideRailGroup>
      </SideRail>
    </Frame>
  ),
};

/* 用路由库时把它的链接组件传给 render；没有地址的项传 onClick，是按钮 */
export const WithRouter: Story = {
  name: "套路由库的链接",
  render: (args) => (
    <Frame>
      <SideRail
        {...args}
        className="h-full"
        action={
          <NavAction render={<RouterLink to="/console" />}>
            前往控制台
          </NavAction>
        }
      >
        <SideRailItem
          icon={<GridIcon />}
          render={<RouterLink to="/overview" />}
          current
        >
          总览
        </SideRailItem>
        <SideRailItem
          icon={<ArchiveIcon />}
          render={<RouterLink to="/archive" />}
        >
          档案
        </SideRailItem>
        <SideRailItem icon={<SlidersIcon />} onClick={() => {}}>
          打开设置
        </SideRailItem>
      </SideRail>
    </Frame>
  ),
};
