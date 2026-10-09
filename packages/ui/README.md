# @endfield-ui/react

终末地风格的 React 基础控件库。非官方，详见 [NOTICE](https://github.com/icaruszezen/endfield-ui/blob/main/NOTICE.md)。

已实现的控件，全部适配亮 / 暗主题与主题色接管：

| 类别 | 控件 |
| --- | --- |
| 基础 | Button / ButtonGroup、IconButton、Toolbar、Tag / TagPair、Badge、Kbd、SectionTitle、BracketTitle、Tabs、Panel |
| 表单 | Field、Input、Textarea、Select、Combobox、TagInput、DatePicker / DateRangePicker / Calendar、FileUpload / FileItem、Checkbox、Radio / RadioGroup、SegmentedControl、Switch、Stepper、Slider、FilterChip |
| 反馈 | Alert、Toast、Progress / ProgressRing、Spinner、Skeleton、EmptyState、Loader、CompletionBanner、RecIndicator |
| 浮层 | Tooltip、Popover、Dialog、Drawer、DropdownMenu、ContextMenu、FlyoutBar |
| 展示 | Table（行能展开）、Stat、Sparkline、DataRowList / DataRow、List / ListRow、Accordion、MediaCard、PlayButton / PlayMark、Carousel、ItemSlot / ItemGrid、Avatar、Timeline、Schedule、Term、ResourceChip、Countdown、Marquee、ScrollHint |
| 导航 | SideRail（含二级）、TopBar、NavMenu、NavAction、Breadcrumb、Pagination、Navigator、AvatarSwitcher、DashIndicator、Steps、Toc、BackToTop |
| 母题 | CornerBrackets、Viewfinder、GhostText、Hatch、Texture、RegistrationStrip、TickRing、HazardStripe |

每个控件的变体与状态见[在线预览](https://icaruszezen.github.io/endfield-ui/)。

## 安装

```bash
pnpm add @endfield-ui/react
```

需要 React 19。走 `tailwind.css` 入口的项目还要有 Tailwind CSS v4，用预编译的 `styles.css` 则不需要。包只出 ESM。

## 技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS v4（CSS-first，`@theme` 令牌，不使用 `tailwind.config.js`） |
| 变体 | 手写的 `Record<Variant, string>` + `cn()`（`clsx` + `tailwind-merge`） |
| 无障碍基元 | [Base UI](https://base-ui.com)（`@base-ui/react`），用在浮层和几个行为复杂的控件上：文字提示、气泡卡片、弹窗、抽屉、全屏菜单、轻提示、下拉选择、组合框、下拉菜单、右键菜单、展开条、折叠面板、滑块、头像。其余控件建立在原生元素上（月历是手写的：Base UI 还没有公开的日历基元） |
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

两个入口都会清掉 Tailwind 的默认色板、圆角、阴影与字阶，并给 `body` 设上主题的底色与字色。字体只声明字体栈、不负责加载，见 [字体规范](https://github.com/icaruszezen/endfield-ui/blob/main/docs/design/foundations/typography.md)。

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

### 链接与路由

能当链接用的控件（按钮、列表行、媒体卡、物品格、面包屑项、菜单项、侧轨项…）传 `href` 渲染成 `<a>`。用路由库时，把它的链接组件传给 `render`：

```tsx
import { Link } from "react-router";

<Button render={<Link to="/archive" />}>查看档案</Button>
<ListRow render={<Link to={`/records/${id}`} />} selected>
  排水泵检修记录
</ListRow>
```

控件算好的类名、状态属性（`aria-current`…）和事件会合并到那个元素上。禁用时它被标上 `aria-disabled` 并拦下点击；地址去不掉，所以它仍然能被聚焦——这一点和 `href` 形态不同。

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

几个短选项要一眼看全时用分段选择。它的语义也是单选组（方向键换值、带 `name` 随表单提交），只是并排摆在一条轨道里：

```tsx
import { Field, Segment, SegmentedControl } from "@endfield-ui/react";

<Field label="时间显示">
  <SegmentedControl name="clock" value={clock} onValueChange={setClock}>
    <Segment value="24">24 小时</Segment>
    <Segment value="12">12 小时</Segment>
  </SegmentedControl>
</Field>
```

- 高度和输入框同三档，并排时对得齐；放在凹陷底色的工具条里用 `variant="outline"`。
- 各段等宽；要撑满一栏加 `className="w-full"`。放不下时文字截断，所以每段两到四个字为好。
- 切换的是下面显示哪一块内容时用 `Tabs`，不是它。

滑块和日期选择同样放进 `Field`，带 `name` 时值随表单提交：

```tsx
import { DatePicker, DateRangePicker, Field, Slider } from "@endfield-ui/react";

<Field label="告警音量">
  <Slider name="volume" value={volume} onValueChange={setVolume} step={5} showValue />
</Field>

<Field label="载重（吨）">
  {/* value 传两个数就是范围滑块 */}
  <Slider value={range} onValueChange={setRange} max={120} showValue />
</Field>

<Field label="发车日期">
  <DatePicker name="depart" value={date} onValueChange={setDate} min="2026-10-01" />
</Field>

<Field label="检修窗口">
  {/* 值是 [起, 止]，两头都包含 */}
  <DateRangePicker startName="from" endName="to" value={range} onValueChange={setRange} />
</Field>
```

- 日期一律是 `YYYY-MM-DD` 的字符串（和原生的 `<input type="date">` 一样），没选是 `null`。
- `DatePicker` 的触发器是按钮，不能打字；只要月历不要外框，用 `Calendar`。
- `DateRangePicker` 点两下选一段：第一下定起始日，第二下定结束日，选完面板才关。后点的那天更早会自动排成先后；起止是同一天也行。两端必须是可选的日子，不可选的日子可以被夹在中间。
- 只要能选一段的月历，用 `<Calendar range>`：值从一个日期变成一对。它只显示一个月，跨月的长区间翻一次月再点第二下。
- `Slider` 的 `onValueChange` 拖的每一步都触发，要发请求的事放在 `onValueCommitted` 里。

自己打出来的一串短词用标签输入，选文件用文件上传：

```tsx
import { Field, FileItem, FileUpload, TagInput } from "@endfield-ui/react";

<Field label="站点标签" help="回车或逗号分开，最多八个。">
  <TagInput name="tags" max={8} value={tags} onValueChange={setTags} />
</Field>

<Field label="交接附件" help="PDF 或图片，单个不超过 10 MB。">
  <FileUpload
    multiple
    accept=".pdf,image/*"
    maxSize={10 * 1024 * 1024}
    name="attachments"
    value={files}
    onValueChange={setFiles}
  />
</Field>
```

- `TagInput` 回车或打出分隔符（默认半角、全角逗号）就加一个，粘贴一串会拆开；没加成的（已经有了、到了 `max`、没过 `validate`）交给 `onReject`。要从现成的选项里挑，用 `Combobox` 的 `multiple`。
- `FileUpload` 只管选和列，不发请求。里面是一个真的 `<input type="file">`：带 `name` 时列表里的文件随表单提交。不合 `accept` / `maxSize` / `maxFiles` 的不收，并在下面说明原因。
- 选了就要传、要显示进度时，用 `renderFile` 自己返回带状态的那一行：`<FileItem name size status="uploading" progress={40} onRemove={remove} />`。

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

步骤条只收一个 `current`（从 0 起），每一步是已完成、当前还是未到由位置算出来：

```tsx
import { Step, Steps } from "@endfield-ui/react";

<Steps aria-label="建站流程" current={step}>
  <Step title="建站" description="选址、供电、通信" onClick={() => setStep(0)} />
  <Step title="测绘" />
  <Step title="复核" invalid={hasError} />
  <Step title="归档" />
</Steps>
```

- 横排在所在的容器窄于 28rem 时自动改成竖排；`orientation="vertical"` 是一直竖排。它靠容器查询量宽度，所以要放在有确定宽度的地方（默认撑满一栏）。
- 传了 `href`、`render` 或 `onClick` 的那一步可以点，用来回到做过的步骤；没传就是纯文字。
- `Steps` 是步骤条，`Stepper` 是加减数字的步进器，别拿错。

一排作用于同一个对象的小工具收进工具栏：整条只占一个 Tab 停靠点，方向键在里面走。

```tsx
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggle,
  ToolbarToggleGroup,
} from "@endfield-ui/react";

<Toolbar aria-label="表格工具">
  <ToolbarToggleGroup aria-label="图层" multiple value={layers} onValueChange={setLayers}>
    <ToolbarToggle value="route" icon={<RouteIcon />} aria-label="路线" />
    <ToolbarToggle value="beacon" icon={<BeaconIcon />} aria-label="信标" />
  </ToolbarToggleGroup>
  <ToolbarSeparator />
  <ToolbarToggle pressed={ruled} onPressedChange={setRuled}>加重线</ToolbarToggle>
  <ToolbarButton icon={<PrintIcon />} onClick={print}>打印</ToolbarButton>
</Toolbar>
```

- 开关组的值是数组：默认同时只按下一个（也可以一个都不按），`multiple` 可以按下几个。表单里"必须选一个"的用 `SegmentedControl`。
- 只有图标的钮必须有 `aria-label`。`ToolbarButton` 可以交给 `DropdownMenu` / `Popover` 的 `trigger`，也可以用 `Tooltip` 包住。
- 不在工具栏里放输入框：左右方向键在输入框里是移光标。

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
- `ContextMenu` 是右键菜单：`<ContextMenu menu={…}>` 包住被右键的那个元素，`menu` 里放的就是上面这些 `DropdownMenuItem`。它只是捷径——里面的操作在页面上要另有入口。
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

选项多到要找的时候换成组合框——一个能打字的下拉，属性和 `Select` 差不多：

```tsx
import { Combobox, Field } from "@endfield-ui/react";

<Field label="常驻站点">
  <Combobox
    name="station"
    placeholder="输入站名或编号"
    items={[
      { value: "n7", label: "北区七号站", keywords: ["N-07"] },
      { value: "s3", label: "南岸三号站", keywords: ["S-03"] },
    ]}
    value={station}
    onValueChange={setStation}
  />
</Field>
```

- `label` 必须是字符串；检索匹配 `label` 和 `keywords`（不显示的别名）。要分组就传 `{ label, items }` 的数组。
- 值只能是选项里有的；清除之后 `onValueChange` 拿到 `null`。
- 加 `multiple`：值是数组，已选项在框里排成一个个小块，框会跟着长高。
- 选项由服务器按输入返回时：`onInputValueChange` 拿到输入的文字去取，`filter={false}` 不在本地再筛一遍，`loading` 时面板里是一行"正在查找…"。

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

### 外壳

宽屏用侧轨，窄屏换成顶栏加全屏菜单——是换一套，不是把侧轨缩小。两边各管各的，什么宽度用哪个由页面的断点决定：

```tsx
import {
  IconButton,
  Menu,
  NavAction,
  NavMenu,
  NavMenuItem,
  SideRail,
  SideRailItem,
  TopBar,
} from "@endfield-ui/react";

<div className="flex min-h-dvh">
  <SideRail
    aria-label="主导航"
    className="hidden lg:flex"
    brand={<Logo />}
    action={<NavAction href="/console">前往控制台</NavAction>}
  >
    <SideRailItem icon={<GridIcon />} href="/overview" current>
      总览
    </SideRailItem>
    <SideRailItem icon={<ArchiveIcon />} href="/archive">
      档案
    </SideRailItem>
  </SideRail>

  <div className="flex min-w-0 flex-1 flex-col">
    <TopBar
      className="lg:hidden"
      brand={<Logo />}
      action={<NavAction href="/console">控制台</NavAction>}
      menu={
        <NavMenu
          title="菜单"
          trigger={
            <IconButton aria-label="打开菜单">
              <Menu />
            </IconButton>
          }
        >
          <NavMenuItem icon={<GridIcon />} href="/overview" current>
            总览
          </NavMenuItem>
        </NavMenu>
      }
    />
    <main>…</main>
  </div>
</div>
```

- `SideRail` 默认展开（图标 + 文字）；`collapsed` 收起成只有图标的窄轨，悬停或键盘聚焦时栏目名浮出来。栏目多了用 `SideRailGroup label` 分组。
- 一个栏目下面还有几个去处：`<SideRailSub icon label>` 里放 `<SideRailSubItem>`。父项只管展开收起；当前项在里面时自己展开。侧轨收起时它变成向右弹出的菜单。
- `NavAction` 是"主行动块"：整个产品最主要的那个去处。放进侧轨、顶栏、全屏菜单的底部时，摆法由它们决定。
- `NavMenu` 打开时焦点移入并被限制在内，背景不可滚动；点一个栏目默认关上。
- 本库不带标志和栏目图标，都由使用方给。
- 侧轨和顶栏默认 `sticky`，在 `--z-nav`（200）这一层，比浮层低。

### 表格

包一层原生 `<table>`，组合着用。排序的状态自己拿着，表头只告诉你"该换成哪个方向"：

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@endfield-ui/react";

<Table label="运输批次" stickyFirstColumn>
  <TableHead>
    <TableRow>
      <TableHeaderCell>批次</TableHeaderCell>
      <TableHeaderCell
        numeric
        sort={sort.key === "count" ? sort.direction : null}
        onSort={(direction) => setSort({ key: "count", direction })}
      >
        件数
      </TableHeaderCell>
      <TableHeaderCell align="end">操作</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id} selected={picked.has(row.id)}>
        <TableCell rowHeader>{row.id}</TableCell>
        <TableCell numeric>{row.count}</TableCell>
        <TableCell reveal align="end">
          <IconButton size="sm" aria-label={`打印 ${row.id}`}>…</IconButton>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

- 单元格默认不折行：放不下时表格在自己的容器里横向滚动。`stickyFirstColumn` 冻结第一列。
- `reveal` 的单元格里放行内操作：悬停或焦点进了这一行才显示，触屏上常显。
- 整行不可点。要进详情把名称写成链接，要勾选在第一列放 `Checkbox`。
- 表头两种：`band`（反转的标题带，默认）和 `muted`；`ruled` 每隔五行加重一条线。
- `stickyHeader` 让表头留在容器的上沿；容器的高度上限自己给（`className="max-h-96"`）。
- 一行下面还有明细时，给 `TableRow` 传 `detail`，并在某一格里放一个 `TableExpander`（通常在名称前面）：展开时明细出现在这一行下面，通栏。状态默认各行自己记，要"全部展开"就用 `expanded` / `onExpandedChange` 自己拿着。

```tsx
<TableRow detail={<Manifest id={row.id} />}>
  <TableCell rowHeader>
    <TableExpander aria-label={`${row.id} 的明细`} /> {row.id}
  </TableCell>
  <TableCell numeric>{row.count}</TableCell>
</TableRow>
```

### 内容与展示

```tsx
import {
  Accordion,
  AccordionItem,
  Avatar,
  AvatarSwitcher,
  AvatarSwitcherItem,
  BackToTop,
  Carousel,
  CarouselSlide,
  MediaCard,
  PlayButton,
  Schedule,
  ScheduleItem,
  ScheduleTrack,
} from "@endfield-ui/react";

<Accordion defaultValue={["route"]}>
  <AccordionItem value="route" title="批次发出之后还能改派吗">
    能。在调度台里选中批次，再选新的目的站。
  </AccordionItem>
</Accordion>

<Avatar name="陈知远" src={portrait} />

<AvatarSwitcher aria-label="队员" value={person} onValueChange={setPerson}>
  <AvatarSwitcherItem value="chen" label="陈知远" src={portrait} />
  <AvatarSwitcherItem value="lin" label="林澈" />
</AvatarSwitcher>

<MediaCard video media={<img src={cover} alt="" />} title="秋季勘探计划 · 预告" href="/pv/1" />

<PlayButton aria-label="播放：秋季勘探计划 · 预告" onClick={play} />

<Carousel aria-label="玩法介绍">
  <CarouselSlide title="线路测绘" description="沿着管廊布设信标。">
    <img src={shot} alt="" />
  </CarouselSlide>
</Carousel>

<Schedule label="十月排期" start="2026-10-01" end="2026-10-31" today={today}>
  <ScheduleTrack label="测绘" icon={<RouteIcon />}>
    <ScheduleItem start="2026-10-03" end="2026-10-12" title="管廊北段" type="限时" />
  </ScheduleTrack>
</Schedule>

<BackToTop />
```

- `Accordion` 默认只开一节，`multiple` 可以同时开几节；`value` 总是数组。收起的内容不在页面里。
- `Avatar` 没有图、图加载失败时显示名字的首字；旁边已经写了名字时传 `alt=""`。
- `AvatarSwitcher` 是一列头像里选一个，语义是单选组（方向键换人）；放不下时给它一个高度上限。
- `MediaCard` 的 `video` 在封面左下角加一个播放记号（黄色小方块，`PlayMark`）。记号不能点，整卡仍然只有一个链接；封面要"点了就在原地播放"时用 `PlayButton`，它是真的按钮。
- `Carousel` 不自动播放。轨道是原生的横向滚动，触屏上直接滑；不在眼前的幻灯片 `Tab` 走不进去。
- `Schedule` 的条目只写起止日期，位置和错行都是算出来的；放不下时在自己的容器里横向滚动。
- `BackToTop` 滚过 400px 才出现，默认钉在视口右下角；点了回到顶部，焦点也交还给页面的头上。要看某个滚动容器时传 `target`，并用 `className` 改位置。祖先上有 `transform` 或容器查询（`@container`）时 `fixed` 不再相对视口：把它放在那一栏的最后，加 `className="sticky bottom-4 self-end"`。
- 本库不带任何图片：头像、轮播和排期里的图都由使用方给。

长页面旁边放一列页内目录：

```tsx
import { Toc, TocItem } from "@endfield-ui/react";

<Toc title="// 本页" offset={64} className="sticky top-20">
  <TocItem href="#bulletin">最新情报</TocItem>
  <TocItem href="#crew" level={2}>队员</TocItem>
</Toc>
```

- 滚到哪一节哪一项亮（`aria-current="location"`）；滚到底是最后一项。点一项就是点一个锚点链接，滚不滚、平不平滑由浏览器和页面的 CSS 决定。
- 页面有吸顶的页头时 `offset` 传它的高度，并给各节的标题加同样大小的 `scroll-mt-*`。内容在某个滚动容器里时传 `target`。
- 位置自己给（`sticky`）；窄屏放不下时由页面收起来。

### 游戏风格的控件

物品格的宽度跟着所在的网格走。格子里只有图标，`name` 是给读屏的名称；选中是四角的角括号，画在格子之外 4px。一组格子放进 `ItemGrid`：它自带留好空隙的网格，并且整个矩阵只占一个 Tab 停靠点，进去之后用方向键在格子之间走。

```tsx
import { ItemGrid, ItemSlot, Tab, TabList, Tabs } from "@endfield-ui/react";

<Tabs defaultValue="supply" variant="wedge">
  <TabList aria-label="仓库分类">
    <Tab value="supply">物资</Tab>
    <Tab value="gear">装备</Tab>
  </TabList>
</Tabs>

<ItemGrid aria-label="物资">
  <ItemSlot
    name="合金锭"
    count={128}
    rarity={2}
    selected={selected === "alloy"}
    onClick={() => setSelected("alloy")}
  >
    <OreIcon size={32} />
  </ItemSlot>
</ItemGrid>
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

用 Tailwind 的项目也可以直接用工具类（`cut-tr`、`wedge-r`、`corner-brackets`、`ghost-hatch`、`hatch`、`hazard`、`dot-grid`、`blueprint-grid`、`contour`），见 [styles/README.md](src/styles/README.md)。这些母题最容易用过头，什么时候该用见 [母题文档](https://github.com/icaruszezen/endfield-ui/blob/main/docs/design/elements/corner-and-wedge.md)。

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

把强调色换成自己的主题色，见 [色彩](https://github.com/icaruszezen/endfield-ui/blob/main/docs/design/foundations/color.md) 的"主题色接管"。

还有第三个取值 `data-theme="inverse"`：和所在的主题相反。面板的标题带、表格的表头带、完成横幅用的就是它，所以放进去的按钮、复选框、焦点环不用另外处理。自己做一块"和页面相反"、里面还要放控件的区域时，写 `data-theme="inverse"` 加 `bg-surface text-ink`——取到的就是 `surface-inverse` / `ink-inverse`。反转块里不要再嵌反转块。

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
| `pnpm test:browser` | 在真的浏览器里测键盘、焦点与布局（先 `pnpm build:docs`），见 [apps/docs](https://github.com/icaruszezen/endfield-ui/blob/main/apps/docs/README.md#浏览器实测) |
| `pnpm typecheck` | 类型检查全部工作区包 |
| `pnpm build` | 生成 `dist/index.js`、`dist/index.d.ts`、`dist/styles.css` |
| `pnpm format` | 用 Prettier 格式化全仓库；`pnpm format:check` 只检查不改，CI 跑的是它 |

格式用 Prettier 的默认配置，提交前跑一次 `pnpm format`。Markdown 不在它的范围里（它会把表格逐列补空格对齐）；Tailwind 的类名顺序也不归它管。

TypeScript 用的是 7.0。tsdown 在这个版本下生成类型声明时会提示"API 尚不稳定"，目前产物正常；如果以后出问题，退路是 `tsc --emitDeclarationOnly`。

### 发布

1. 改本目录 `package.json` 里的 `version`，提交并推到 `main`，等 CI 跑完。
2. 打一个和版本号对应的标签推上去：`git tag v0.2.0`，`git push origin v0.2.0`。
3. [publish.yml](https://github.com/icaruszezen/endfield-ui/blob/main/.github/workflows/publish.yml) 核对标签与版本号，跑类型检查、测试与构建（`prepublishOnly`），然后发布到 npm。

认证用的是 npm 的 Trusted Publishing，仓库里不存 token：npm 上这个包的设置里登记了本仓库和 `publish.yml` 这个文件名，两边任何一个改名都要同步。

`LICENSE` 和 `NOTICE.md` 只在仓库根目录有一份，打包时由 `prepack` 复制到本目录（所以它们在这里是被 git 忽略的）。想看包里到底会有什么：`pnpm pack`。

## 与设计文档的关系

- 所有视觉决策以 [docs/design](https://github.com/icaruszezen/endfield-ui/blob/main/docs/design/overview.md) 为准；代码里出现文档没有的颜色或尺寸时，先改文档再改代码。
- 组件的状态、尺寸与形状规范在 [docs/design/components](https://github.com/icaruszezen/endfield-ui/blob/main/docs/design/components/README.md)，那里同时给出了各期的清单与顺序。
- 令牌的唯一来源是 [src/styles/theme.css](src/styles/theme.css)，文档中的令牌表与它逐项对应。
