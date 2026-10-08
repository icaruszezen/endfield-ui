# @endfield-ui/react

终末地风格的 React 基础控件库。非官方，详见 [NOTICE](../../NOTICE.md)。

**第一期已实现**：Button、IconButton、Tag / TagPair、Badge、SectionTitle、Tabs、Panel。全部适配亮 / 暗主题与主题色接管。包还没有发布到 npm，目前只在本仓库的工作区里使用。

## 技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS v4（CSS-first，`@theme` 令牌，不使用 `tailwind.config.js`） |
| 变体 | 手写的 `Record<Variant, string>` + `cn()`（`clsx` + `tailwind-merge`） |
| 无障碍基元 | 第一期没有引入。Radix UI / React Aria / Base UI 三选一，写第一个浮层组件前决定 |
| 构建 | tsdown（ESM + 类型声明）+ `@tailwindcss/cli`（预编译 CSS） |
| 测试 | Vitest + Testing Library（jsdom） |

## 使用

### 样式

已经在用 Tailwind CSS v4 的项目，用本包的入口代替 `@import "tailwindcss"`。它依次引入 Tailwind、令牌、母题工具类，并让 Tailwind 扫到本包组件用到的类名：

```css
@import "@endfield-ui/react/tailwind.css";
```

不用 Tailwind 的项目，引入预编译好的样式：

```ts
import "@endfield-ui/react/styles.css";
```

只想要令牌：`@endfield-ui/react/theme.css`（用法见 [styles/README.md](src/styles/README.md)）。

两个入口都会清掉 Tailwind 的默认色板、圆角、阴影与字阶，并给 `body` 设上主题的底色与字色。字体只声明字体栈、不负责加载，见 [字体规范](../../docs/design/foundations/typography.md)。

### 组件

```tsx
import { Button, SectionTitle, Tab, TabList, TabPanel, Tabs } from "@endfield-ui/react";

export function Bulletin() {
  return (
    <section>
      <SectionTitle latin="Bulletin">最新情报</SectionTitle>
      <Tabs defaultValue="news">
        <TabList aria-label="情报分类">
          <Tab value="news">新闻</Tab>
          <Tab value="notice">公告</Tab>
        </TabList>
        <TabPanel value="news">…</TabPanel>
        <TabPanel value="notice">…</TabPanel>
      </Tabs>
      <Button variant="text" href="/news">查看全部</Button>
    </section>
  );
}
```

### 主题

默认亮色。在 `<html>`（或任意容器）上加 `data-theme="dark"` 切到暗色；暗色区域里也可以用 `data-theme="light"` 切回来。

```tsx
import { useTheme } from "@endfield-ui/react";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      切换主题
    </button>
  );
}
```

`useTheme` 读写 `<html data-theme>`，支持 `"light"`、`"dark"`、`"system"`，选择记在 `localStorage` 的 `ef-theme` 里。要避免首屏闪一下亮色，在 `<head>` 里用一小段内联脚本提前把 `data-theme` 写好。

把强调色换成自己的主题色，见 [色彩](../../docs/design/foundations/color.md) 的"主题色接管"。

## 目录

```
packages/ui/
└── src/
    ├── index.ts      入口
    ├── components/   一组件一目录，见 components/README.md
    ├── styles/       令牌、母题工具类、样式入口，见 styles/README.md
    ├── hooks/        与组件无关的通用 hooks
    ├── lib/          纯函数工具
    └── icons/        原创图标组件，不收录官方图标
```

## 开发

在仓库根目录：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Storybook（`http://localhost:6106`），直接读本包源码，改了即热更新 |
| `pnpm test` | 跑单元测试 |
| `pnpm typecheck` | 类型检查全部工作区包 |
| `pnpm build` | 生成 `dist/index.js`、`dist/index.d.ts`、`dist/styles.css` |

TypeScript 用的是 7.0。tsdown 在这个版本下生成类型声明时会提示"API 尚不稳定"，目前产物正常；如果以后出问题，退路是 `tsc --emitDeclarationOnly`。

## 与设计文档的关系

- 所有视觉决策以 [docs/design](../../docs/design/overview.md) 为准；代码里出现文档没有的颜色或尺寸时，先改文档再改代码。
- 组件的状态、尺寸与形状规范在 [docs/design/components](../../docs/design/components/README.md)，那里同时给出了各期的清单与顺序。
- 令牌的唯一来源是 [src/styles/theme.css](src/styles/theme.css)，文档中的令牌表与它逐项对应。
