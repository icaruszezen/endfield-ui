# @endfield-ui/react

终末地风格的 React 基础控件库。非官方，详见 [NOTICE](../../NOTICE.md)。

已实现的控件，全部适配亮 / 暗主题与主题色接管：

| 类别 | 控件 |
| --- | --- |
| 基础 | Button、IconButton、Tag / TagPair、Badge、SectionTitle、Tabs、Panel |
| 表单 | Field、Input、Textarea、Checkbox、Radio / RadioGroup、Switch、Stepper、FilterChip |
| 反馈 | Alert、Progress / ProgressRing、Skeleton、EmptyState、Loader |
| 展示 | Stat、List / ListRow、MediaCard、Timeline、ResourceChip、Countdown、Marquee、ScrollHint |
| 导航 | Breadcrumb、Pagination、Navigator、DashIndicator |

包还没有发布到 npm，目前只在本仓库的工作区里使用。

## 技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS v4（CSS-first，`@theme` 令牌，不使用 `tailwind.config.js`） |
| 变体 | 手写的 `Record<Variant, string>` + `cn()`（`clsx` + `tailwind-merge`） |
| 无障碍基元 | 还没有引入：现有控件都建立在原生元素上。Radix UI / React Aria / Base UI 三选一，写第一个浮层组件前决定 |
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

### 表单

标签、帮助文字、错误说明由 `Field` 统一关联到里面的控件；一组复选或一个单选组用 `group`，渲染成 `<fieldset>` + `<legend>`。

```tsx
import { Checkbox, Field, Input, Radio, RadioGroup, Switch } from "@endfield-ui/react";

<Field label="代号" required help="两到十二个字母。" error={error}>
  <Input value={codename} onChange={(event) => setCodename(event.target.value)} />
</Field>

<Field group label="测绘精度">
  <RadioGroup defaultValue="standard" onValueChange={setPrecision}>
    <Radio value="draft">草图</Radio>
    <Radio value="standard">标准</Radio>
  </RadioGroup>
</Field>

<Checkbox defaultChecked>归档时保存原始读数</Checkbox>
<Switch onCheckedChange={setSync}>自动同步</Switch>
```

表单控件都是原生 `<input>` / `<textarea>` 套样式：`name`、`value`、`required`、`ref` 这些属性直接落在原生元素上，可以照常放进 `<form>` 提交。`className` 给的是外层（输入框的外框、复选框的整行）。

### 带状态的控件

步进器、分页条、胶囊导航器都有受控与非受控两种用法：传 `value` / `page` / `index` 就由外面决定，只传 `default…` 就由控件自己记。

```tsx
import { Navigator, Pagination, Stepper } from "@endfield-ui/react";

<Stepper value={count} onValueChange={setCount} min={1} max={99} />

<Pagination page={page} pageCount={12} onPageChange={setPage} jump />

<Navigator
  aria-label="勘探区"
  items={["谷地", "第七勘探区", "荒原"]}
  index={zone}
  onIndexChange={setZone}
/>
```

页码从 1 起，`index` 从 0 起。

### 加载页

`Loader` 默认铺满视口，并在加载期间锁住页面滚动和焦点。内容就绪后把 `open` 置为 `false`，遮罩滑出、随后自己卸载：

```tsx
import { Loader } from "@endfield-ui/react";

<Loader value={progress} open={!ready} tagline="正在同步档案" />
```

不知道真实进度就不传 `value`。只想盖住页面的一块区域时加 `fullscreen={false}`，并让那块区域带 `relative` 与 `overflow-hidden`。

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
