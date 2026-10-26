/*
 * 页面外壳：宽屏是侧轨，窄于 1024px 换成顶栏加全屏菜单——两边的栏目是同一份目录。
 * 搜索、亮暗切换在两边各有一个入口，开的是同一个弹窗、改的是同一个主题。
 */
import {
  IconButton,
  Menu,
  NavAction,
  NavMenu,
  NavMenuItem,
  RegistrationStrip,
  SideRail,
  SideRailItem,
  SideRailSub,
  SideRailSubItem,
  TopBar,
  useTheme,
} from "@endfield-ui/react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ComponentsIcon,
  ContrastIcon,
  ElementsIcon,
  ExternalIcon,
  FoundationsIcon,
  GameIcon,
  HomeIcon,
  OverviewIcon,
  ReferencesIcon,
  SearchIcon,
  SurfacesIcon,
} from "./icons.tsx";
import { SearchDialog } from "./Search.tsx";
import { pageHref } from "./site.ts";
import type { SiteData } from "./types.ts";

const groupIcons: Record<string, ReactNode> = {
  overview: <OverviewIcon />,
  foundations: <FoundationsIcon />,
  elements: <ElementsIcon />,
  surfaces: <SurfacesIcon />,
  components: <ComponentsIcon />,
  game: <GameIcon />,
  references: <ReferencesIcon />,
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** 站名。不是标志：一个墨色方块加一条强调色竖条，是官网首页按钮上的那个记号 */
function Brand({ data }: { data: SiteData }) {
  return (
    <a
      href={data.base}
      aria-label="endfield-ui 设计规范，回到首页"
      className={`flex min-w-0 items-center gap-2.5 text-ink ${focusRing}`}
    >
      <span
        aria-hidden="true"
        className="relative block size-7 shrink-0 bg-surface-inverse"
      >
        <span className="absolute top-1/4 left-1.5 h-1/2 w-[3px] bg-accent-ink-inverse" />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-display text-sm font-bold whitespace-nowrap uppercase">
          endfield-ui
        </span>
        <span className="mt-1 font-tech text-micro whitespace-nowrap text-ink-secondary">
          设计规范 · 非官方
        </span>
      </span>
    </a>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <IconButton
      aria-label={dark ? "切换到亮色" : "切换到暗色"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <ContrastIcon />
    </IconButton>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-ink-secondary transition-colors duration-(--duration-fast) hover:text-ink ${focusRing}`}
    >
      {children}
      <ExternalIcon size={12} />
    </a>
  );
}

export function Shell({
  data,
  children,
}: {
  data: SiteData;
  children: ReactNode;
}) {
  const [searching, setSearching] = useState(false);
  const { nav, page, links } = data;
  const isCurrent = (route: string) => page.route === route;

  // 水合完了在 <html> 上留个记号：浏览器实测等的是它
  useEffect(() => {
    document.documentElement.dataset.ready = "";
  }, []);

  // `/` 或 Ctrl / ⌘ + K 打开搜索；正在输入的时候 `/` 不拦
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable === true ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "");
      const combo =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (combo || (event.key === "/" && !typing && !event.altKey)) {
        event.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchButton = (
    <IconButton aria-label="搜索文档" onClick={() => setSearching(true)}>
      <SearchIcon />
    </IconButton>
  );
  const preview = (label: string) => (
    <NavAction href={links.storybook} target="_blank" rel="noopener noreferrer">
      {label}
    </NavAction>
  );

  return (
    <div className="flex min-h-dvh bg-surface text-ink">
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-(--z-toast) focus-visible:bg-surface-inverse focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:text-ink-inverse"
      >
        跳到正文
      </a>

      <SideRail
        aria-label="文档导航"
        className="hidden print:hidden lg:flex"
        brand={<Brand data={data} />}
        tools={
          <>
            {searchButton}
            <ThemeToggle />
          </>
        }
        action={preview("组件预览")}
        footer={
          <>
            <ExternalLink href={links.github}>GitHub 仓库</ExternalLink>
            <ExternalLink href={links.npm}>npm 上的组件库</ExternalLink>
          </>
        }
      >
        <SideRailItem
          icon={<HomeIcon />}
          href={data.base}
          current={page.kind === "home"}
        >
          首页
        </SideRailItem>
        {nav.map((group) => {
          const only = group.items[0];
          // 只有一篇的组（总纲）不用再套一层
          if (group.items.length === 1 && only) {
            return (
              <SideRailItem
                key={group.key}
                icon={groupIcons[group.key]}
                href={pageHref(data, only.route)}
                current={isCurrent(only.route)}
              >
                {only.title}
              </SideRailItem>
            );
          }
          return (
            <SideRailSub
              key={group.key}
              icon={groupIcons[group.key]}
              label={group.title}
            >
              {group.items.map((item) => (
                <SideRailSubItem
                  key={item.route}
                  href={pageHref(data, item.route)}
                  current={isCurrent(item.route)}
                >
                  {item.title}
                </SideRailSubItem>
              ))}
            </SideRailSub>
          );
        })}
      </SideRail>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          className="print:hidden lg:hidden"
          brand={<Brand data={data} />}
          tools={
            <>
              {searchButton}
              <ThemeToggle />
            </>
          }
          menu={
            <NavMenu
              trigger={
                <IconButton aria-label="打开菜单">
                  <Menu />
                </IconButton>
              }
              title="文档导航"
              navLabel="文档导航"
              brand={<Brand data={data} />}
              ghost="DESIGN"
              footer={preview("组件预览")}
            >
              <NavMenuItem
                icon={<HomeIcon />}
                href={data.base}
                current={page.kind === "home"}
              >
                首页
              </NavMenuItem>
              {nav.flatMap((group) => [
                <li
                  key={`${group.key}-label`}
                  className="px-1 pt-4 pb-1 font-tech text-xs text-ink-secondary"
                >
                  <span aria-hidden="true">{"// "}</span>
                  {group.title}
                </li>,
                ...group.items.map((item) => (
                  <NavMenuItem
                    key={item.route}
                    icon={groupIcons[group.key]}
                    href={pageHref(data, item.route)}
                    current={isCurrent(item.route)}
                  >
                    {item.title}
                  </NavMenuItem>
                )),
              ])}
            </NavMenu>
          }
        />

        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-10"
        >
          {children}
        </main>

        <footer className="border-t border-line px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-sm text-ink-secondary">
            <RegistrationStrip rule />
            <p className="max-w-prose">
              非官方的爱好者项目，与鹰角网络（Hypergryph）无关；站内的图解与示例都是原创，
              不包含任何官方素材。《明日方舟：终末地》及其素材的权利归鹰角网络所有。
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-2 font-tech text-xs">
              <ExternalLink href={links.notice}>版权与商标声明</ExternalLink>
              <ExternalLink href={links.storybook}>组件预览</ExternalLink>
              <ExternalLink href={links.github}>GitHub</ExternalLink>
              <ExternalLink href={links.npm}>npm</ExternalLink>
              <span>原创内容以 MIT 发布</span>
            </p>
          </div>
        </footer>
      </div>

      <SearchDialog data={data} open={searching} onOpenChange={setSearching} />
    </div>
  );
}
