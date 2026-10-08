# @endfield-ui/react

终末地风格的 React 基础控件库。非官方，详见 [NOTICE](../../NOTICE.md)。

已实现的控件，全部适配亮 / 暗主题与主题色接管：

| 类别 | 控件 |
| --- | --- |
| 基础 | Button / ButtonGroup、IconButton、Tag / TagPair、Badge、Kbd、SectionTitle、BracketTitle、Tabs、Panel |
| 表单 | Field、Input、Textarea、Select、Checkbox、Radio / RadioGroup、Switch、Stepper、FilterChip |
| 反馈 | Alert、Toast、Progress / ProgressRing、Spinner、Skeleton、EmptyState、Loader、CompletionBanner、RecIndicator |
| 浮层 | Tooltip、Popover、Dialog、Drawer、DropdownMenu、FlyoutBar |
| 展示 | Stat、Sparkline、DataRowList / DataRow、List / ListRow、MediaCard、ItemSlot、Timeline、Term、ResourceChip、Countdown、Marquee、ScrollHint |
| 导航 | Breadcrumb、Pagination、Navigator、DashIndicator |
| 母题 | CornerBrackets、Viewfinder、GhostText、Hatch、Texture、RegistrationStrip、TickRing、HazardStripe |

包还没有发布到 npm，目前只在本仓库的工作区里使用。

## 技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS v4（CSS-first，`@theme` 令牌，不使用 `tailwind.config.js`） |
| 变体 | 手写的 `Record<Variant, string>` + `cn()`（`clsx` + `tailwind-merge`） |
| 无障碍基元 | [Base UI](https://base-ui.com)（`@base-ui/react`），只用在浮层上：文字提示、气泡卡片、弹窗、抽屉、轻提示、下拉选择、下拉菜单、展开条。其余控件建立在原生元素上 |
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

### 浮层

文字提示、气泡卡片、弹窗、抽屉、下拉菜单、展开条、下拉选择、轻提示。焦点的进出与锁定、键盘、定位与翻转都交给 Base UI，这里只管长相；用的时候不用自己拼部件。触发元素作为一个 React 元素传进去：

```tsx
import {
  Button,
  Dialog,
  DialogClose,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  IconButton,
  Tooltip,
} from "@endfield-ui/react";

<Tooltip content="锁定的物品不会被销毁">
  <IconButton aria-label="锁定">
    <Lock />
  </IconButton>
</Tooltip>

<Dialog
  alert
  size="sm"
  trigger={<Button variant="danger">销毁</Button>}
  title="销毁 3 件物资"
  description="销毁之后无法找回。"
  footer={
    <>
      <DialogClose>
        <Button variant="light">取消</Button>
      </DialogClose>
      <DialogClose>
        <Button variant="danger" onClick={destroy}>
          销毁 3 件
        </Button>
      </DialogClose>
    </>
  }
/>

<DropdownMenu trigger={<Button variant="light">操作</Button>}>
  <DropdownMenuItem onClick={rename}>重命名</DropdownMenuItem>
  <DropdownMenuItem href="/detail">查看详情</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem tone="danger" onClick={remove}>
    删除
  </DropdownMenuItem>
</DropdownMenu>
```

- `Dialog` 与 `Drawer` 也可以不传 `trigger`，自己用 `open` / `onOpenChange` 控制。`alert` 是破坏性操作的确认：点遮罩不关。
- `Dialog` 有两处默认关着的装饰：`ornament`（标题下一排小方点）和 `cornerArt`（左下角的线稿，传你自己的原创图形）。
- `Drawer` 的 `side` 是 `right`（默认）、`left`、`bottom`，都可以朝来的方向划走。
- 菜单里除了操作项，还有单选组（`DropdownMenuRadioGroup`，当前项）、复选项（`DropdownMenuCheckboxItem`，能开能关的设置，勾了不关菜单）和一层子菜单（`DropdownMenuSub`）。
- `FlyoutBar` 是从一个图标按钮旁边拉开的一条横排操作（分享的几个去处），键盘上是一个横向的菜单。里面放 `FlyoutBarItem`：子元素是图标，只有图标时必须给 `aria-label`。触发按钮用 `<IconButton variant="inverse">`，它的 `aria-label` 同时是这一条的名称。
- `Popover` 是点击触发、里面可以操作的一小块面板（`trigger`、`title`、`description` + 子元素），不打断页面。一句说明用 `Tooltip`，必须做完才能继续的用 `Dialog`。
- 触发元素要是一个按钮，并且把收到的属性和 `ref` 交给原生元素。本库的 `Button`、`IconButton` 都可以直接用。

下拉选择的触发器和输入框长得一样，放进 `Field` 自动关联标签与错误说明：

```tsx
import { Field, Select } from "@endfield-ui/react";

<Field label="所属地区" error={error}>
  <Select
    name="region"
    placeholder="请选择"
    items={[
      { value: "valley", label: "四号谷地" },
      { value: "ridge", label: "北岭" },
    ]}
    value={region}
    onValueChange={setRegion}
  />
</Field>
```

加 `multiple` 可以选多项：`value` 与 `onValueChange` 换成字符串数组，选项行首多一个小方格，选了不关面板；触发器里把已选项用顿号连起来并带一个计数，换写法用 `renderValue`。

轻提示要先在应用最外层包一个 `ToastProvider`，里面的任何地方用 `useToast()` 弹出。同时只显示一条，新的替换旧的：

```tsx
import { ToastProvider, useToast } from "@endfield-ui/react";

<ToastProvider>
  <App />
</ToastProvider>;

function SaveButton() {
  const toast = useToast();
  return (
    <Button
      onClick={async () => {
        await save();
        toast({ message: "设置已保存", tone: "success" });
      }}
    >
      保存
    </Button>
  );
}
```

带 `action` 的提示（"撤销"）会多停一会儿并出现关闭图标。需要用户处理的信息不要用轻提示，用 `Alert` 或 `Dialog`。

接入时要知道的三件事：

- **浮层挂在 `<body>` 下。** 它们的 `z-index` 是 `--z-overlay`（300），轻提示是 `--z-toast`（400）。应用里有更高的层时，在 `:root` 上改这两个变量。所有浮层共用一个值、靠打开的先后叠，所以弹窗里的下拉能盖住弹窗——不要单独给某个浮层加高。
- **局部主题会跟过去。** 暗色版块（`data-theme="dark"`）里的按钮打开的弹窗也是暗色的：浮层打开时从触发元素往上找最近的 `data-theme` / `data-choice` 抄到自己身上。没有触发元素的受控弹窗跟随 `<html>`；需要时把 `data-theme` 直接传给它。
- **`@base-ui/react` 是本包的依赖**，装本包时会一起装上，不用另外引入。

### 游戏风格的控件

物品格的宽度跟着所在的网格走。格子里只有图标，`name` 是给读屏的名称；选中是四角的角括号，画在格子之外 4px，所以网格四周要留出这段空隙：

```tsx
import { ItemSlot, Tab, TabList, Tabs } from "@endfield-ui/react";

<Tabs defaultValue="supply" variant="wedge">
  <TabList aria-label="仓库分类">
    <Tab value="supply">物资</Tab>
    <Tab value="gear">装备</Tab>
  </TabList>
</Tabs>

<div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2 p-1">
  <ItemSlot
    name="合金锭"
    count={128}
    rarity={2}
    selected={selected === "alloy"}
    onClick={() => setSelected("alloy")}
  >
    <OreIcon size={32} />
  </ItemSlot>
</div>
```

复选与单选可以整体换成菱形符号。它不是组件上的属性，而是和主题一样写在 `<html>`（或局部容器）上的开关，全库选一套：

```html
<html data-theme="dark" data-choice="diamond">
```

菱形方案下复选和单选长得一样，"能选几个"要靠分组标题讲清楚。

数据行带是游戏里数据面板的样子：浅色画布上一条条深色的行。语义是一张表格，列由 `columns` 决定：

```tsx
import { DataRow, DataRowList } from "@endfield-ui/react";

<DataRowList
  label="本周收支"
  columns={{ name: "项目", trend: "走势", value: "当前", reference: "理论" }}
>
  <DataRow
    name="钢材"
    categoryColor="var(--color-special)"
    favorite={favorites.has("steel")}
    onFavoriteChange={(next) => toggle("steel", next)}
    series={[42, 58, 51, 77, 69, 88]}
    value="+128"
    tone="info"
    reference="+140"
  />
</DataRowList>
```

- `tone` 是当前值的含义：`info` 产出、`accent` 消耗、`danger` 超支。正负号连同数值一起传，颜色之外还要有符号。
- `series` 画成行内的小型面积图；这种图也可以单独用：`<Sparkline data variant tone />`，撑满给它的盒子。
- 不给 `trend` 或 `reference` 的列名就没有那一列；容器变窄时也是先收这两列。
- 普通的列表要这种深色行带时写 `<List variant="band">`，选中行整行反转成白底墨字。

### 母题

镂空巨字、斜纹、底纹、注册色条、刻度圆环、取景角、警示条纹、角括号各有一个组件。除了角括号（它表示选中），其余都是纯装饰：对读屏隐藏、不挡点击，高对比模式与打印时不显示。

底纹有点阵、工程网格、等高线三种（`<Texture variant="dots" | "grid" | "contour">`），铺满最近的定位祖先。一个视口选一种，文字下面垫一层实色：

```tsx
import { BracketTitle, Texture } from "@endfield-ui/react";

<section className="relative overflow-clip bg-surface-raised p-4">
  <Texture />
  <div className="relative bg-surface-raised p-5">
    <BracketTitle>北区仓储站</BracketTitle>
  </div>
</section>
```

```tsx
import { GhostText, TickRing, Viewfinder } from "@endfield-ui/react";

<section className="relative overflow-clip">
  <GhostText className="absolute -right-6 -bottom-5">//Archive</GhostText>
  <div className="relative">…</div>
</section>

<Viewfinder data-theme="dark" crosshair readouts={{ bottomRight: "16 : 9" }}>
  <img src={scene} alt="谷地北侧的地形" />
</Viewfinder>

<TickRing size={200} spin>
  <Model />
</TickRing>
```

叠在画面上的东西（取景角、刻度圆环、录制指示）颜色跟的是**画面**，不是页面：画面是深色的就在它上面加 `data-theme="dark"`。

用 Tailwind 的项目也可以直接用工具类（`cut-tr`、`wedge-r`、`corner-brackets`、`ghost-hatch`、`hatch`、`hazard`、`dot-grid`、`blueprint-grid`、`contour`），见 [styles/README.md](src/styles/README.md)。这些母题最容易用过头，什么时候该用见 [母题文档](../../docs/design/elements/corner-and-wedge.md)。

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
    ├── hooks/        与组件无关的通用 hooks（主题、受控状态、浮层的局部主题）
    ├── lib/          纯函数工具
    └── icons/        原创图标组件，不收录官方图标
```

## 开发

在仓库根目录：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Storybook（`http://localhost:6106`），直接读本包源码，改了即热更新 |
| `pnpm test` | 跑单元测试 |
| `pnpm test:browser` | 在真的浏览器里测键盘、焦点与布局（先 `pnpm build:docs`），见 [apps/docs](../../apps/docs/README.md#浏览器实测) |
| `pnpm typecheck` | 类型检查全部工作区包 |
| `pnpm build` | 生成 `dist/index.js`、`dist/index.d.ts`、`dist/styles.css` |
| `pnpm format` | 用 Prettier 格式化全仓库；`pnpm format:check` 只检查不改，CI 跑的是它 |

格式用 Prettier 的默认配置，提交前跑一次 `pnpm format`。Markdown 不在它的范围里（它会把表格逐列补空格对齐）；Tailwind 的类名顺序也不归它管。

TypeScript 用的是 7.0。tsdown 在这个版本下生成类型声明时会提示"API 尚不稳定"，目前产物正常；如果以后出问题，退路是 `tsc --emitDeclarationOnly`。

## 与设计文档的关系

- 所有视觉决策以 [docs/design](../../docs/design/overview.md) 为准；代码里出现文档没有的颜色或尺寸时，先改文档再改代码。
- 组件的状态、尺寸与形状规范在 [docs/design/components](../../docs/design/components/README.md)，那里同时给出了各期的清单与顺序。
- 令牌的唯一来源是 [src/styles/theme.css](src/styles/theme.css)，文档中的令牌表与它逐项对应。
