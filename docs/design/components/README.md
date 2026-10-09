# 组件规范

把基础规范落到具体控件上：每个组件长什么样、有哪些状态、多大。这里是 [`packages/ui`](../../../packages/ui/README.md) 的设计输入。**清单里的控件已经全部实现**，各期清单里逐项写了做到哪一步；最后一期是后来补的、最初的清单里没有的控件。

## 怎么读

| 文档 | 覆盖的组件 |
| --- | --- |
| [按钮](button.md) | 按钮、图标按钮、按钮组、工具栏 |
| [导航](navigation.md) | 侧轨（含二级）、主行动块、顶栏与全屏菜单、页签、分页、胶囊导航器、头像切换、面包屑、步骤条、页内目录、回到顶部 |
| [卡片](card.md) | 面板、折叠面板、媒体卡（含播放钮）、媒体轮播、物品格、列表行 |
| [表单](form.md) | 输入框、下拉、组合框、标签输入、复选、单选、分段选择、开关、步进器、滑块、日期选择、文件上传 |
| [反馈](feedback.md) | 进度、提示条、轻提示、加载、空状态 |
| [浮层](overlay.md) | 弹窗、抽屉、下拉菜单、右键菜单、展开条、文字提示、气泡卡片 |
| [数据展示](data-display.md) | 标签与徽章、数据行带、统计块、头像、表格（含行展开）、时间线、排期 |

每篇的结构：**用途 → 图解 → 规格表 → 状态 → 行为与无障碍 → 宜 / 忌 → 来源**。

规格表里的数值分两种：

- 颜色与状态变化多数是**实测**（官网）或**社区**（游戏界面）；
- 尺寸是把官网的流式 `rem` 换算到 16px 基准后的**建议值**，实现时可以微调。

## 通用约定

### 尺寸

三档，全库统一：

| 档 | 控件高度 | 字号 | 水平内边距 | 用在哪 |
| --- | --- | --- | --- | --- |
| `sm` | 32px | `text-sm` | 12px | 工具栏、表格内、紧凑面板 |
| `md` | 40px | `text-base` | 16px | **默认** |
| `lg` | 56px | `text-lg` | 24px | 首屏的主要行动、移动端的主要按钮 |

官网通用按钮是 4.5rem 高，在 1920 稿上是 54px、在 1440 视口上约 40px，所以 `md` 取 40、`lg` 取 56。

触屏上任何可点击元素的点击区域不小于 40 × 40px。

### 状态

每个交互组件按需实现：

| 状态 | 表达方式 |
| --- | --- |
| 默认 | — |
| 悬停 | 换底色。不上浮、不放大、不加阴影。只在有指针的设备上生效 |
| 按下 | 更深一档的底色。不缩小 |
| 聚焦 | 2px `focus` 色的环，与元素间隔 2px。仅键盘聚焦时出现（`:focus-visible`） |
| 选中 / 当前 | 填充反转、边条、角括号、选中环，按组件选一种 |
| 禁用 | 降低对比但保持可读；不响应悬停 |
| 加载 | 保持尺寸稳定，不让布局跳动 |
| 错误 | 语义色 + 图标 + 文字说明，三者齐全 |

### 命名

- 变体用语义名：`action`、`control`、`light`、`danger`。不用颜色名。
- 尺寸用 `sm` / `md` / `lg`。
- 形状是变体的一部分，不单独暴露成属性：不提供 `rounded`、`cut` 这类让使用者随意组合的开关。
- 色调用 `tone`：`neutral`、`info`、`success`、`warning`、`danger`。

### 主题

所有组件只使用 [theme.css](../../../packages/ui/src/styles/theme.css) 里的语义令牌（`surface`、`ink`、`line`、`action`、`control`…），因此自动适配亮 / 暗主题与主题色接管。组件内不出现十六进制色值。

几条实现时定下的细则：

- **随主题翻转的颜色一律用语义令牌。** 只有"本来就是为某一种底色设计"的填充才直接用 `neutral-*`、在两个主题下保持不变，清单见 [色彩](../foundations/color.md) 的"哪些颜色有意不随主题变"。
- **压在反转块上的强调记号用 `accent-ink-inverse`，不直接用 `action`。** `surface-inverse` 在暗色主题下是近白，黄色压在上面看不见。已选的复选与单选、开启的开关、反转图标钮的图标都是这一条。
- **反转块里还要放别的控件时，把它做成反转主题**（`data-theme="inverse"`），里面照常用 `surface`、`ink`、`accent-ink`。面板的标题带、表格的表头带、完成横幅都是。见 [色彩](../foundations/color.md#反转块里的局部主题)。
- **压在页面表面上的强调记号用 `accent-ink`。** 行动色在亮色表面上同样看不见（必填标记）。
- **悬停底用 `bg-ink/5`，不用 `surface-sunken`。** 后者在暗色主题下是纯黑，悬停会变暗而选中变亮，方向相反（页签、列表行）。

### 链接与路由

能当链接用的控件（按钮、列表行、媒体卡、物品格、面包屑项、菜单项、展开条的项，以及侧轨项、全屏菜单项、主行动块）有两种写法：

| 写法 | 渲染成什么 |
| --- | --- |
| `href="/archive"` | 原生的 `<a>` |
| `render={<Link to="/archive" />}` | 你给的那个元素——路由库的链接组件 |

```tsx
<Button render={<Link to="/archive" />}>查看档案</Button>
```

- 控件算好的类名、状态属性（`aria-current`、`data-variant`…）和事件会合并到那个元素上：类名拼在一起，事件两边都触发，其余属性以那个元素自己写的为准。
- 传了 `render` 就按链接处理，哪怕没有 `href`——地址在那个元素自己手里。
- 这个写法和浮层的触发元素是同一个（都是 Base UI 的 `render`），所以库里没有 `asChild`。
- **禁用时有一处差别。** `href` 形态下，禁用的链接被去掉地址，焦点也到不了它。`render` 形态下地址去不掉，所以它仍然能被聚焦；控件给它标上 `aria-disabled` 并拦下点击（路由库的链接组件看到点击被拦下就不会跳转）。

### 无障碍

- 用原生元素（`button`、`a`、`input`）；浮层这类原生元素做不好的，用无障碍基元 [Base UI](https://base-ui.com)。
- 纯图标控件必须有可访问名称。
- 状态不只靠颜色表达。
- 装饰元素（竖条、括号、纹理、巨字）对辅助技术隐藏。
- 动效遵守"减少动态效果"。
- `clip-path` 切角不能裁掉焦点环，做法见 [切角与斜楔](../elements/corner-and-wedge.md)。

## 组件清单与建议顺序

按"先把语言立住，再铺开"的顺序。每一期做完都应该能搭出一类完整的页面。

### 第一期：立住语言（已实现）

能搭出一个官网气质的内容页。源码在 [packages/ui/src/components](../../../packages/ui/src/components/README.md)，在仓库根目录 `pnpm dev` 可以在 Storybook 里并排看亮暗两套。

| 组件 | 规范 | 要点 |
| --- | --- | --- |
| Button | [按钮](button.md) | 竖条变箭头的悬停是标志性细节 |
| IconButton | [按钮](button.md) | 圆形与方形两种 |
| Tag / TagPair / Badge | [数据展示](data-display.md) | 名值对、类型标签、日期块、通知角标 |
| SectionTitle | [分节标题](../elements/section-title.md) | 标准、色带、竖排三种形态，外加一个简化版 |
| Tabs | [导航](navigation.md) | 激活时文字让位给箭头；另有胶囊、楔形两种变体 |
| Panel | [卡片](card.md) | 直角、1px 线、无阴影 |

这一期当时没做、后来补上的：按钮组、列表行、媒体卡、物品格、胶囊族的筛选 / 资源 / 倒计时徽章、增益签、日期块的小红角、页签的 `wedge` 变体。

### 第二期：表单与反馈

能搭出设置页、表单页、列表页。在 Storybook 的"示例 / 设置页"和"示例 / 列表页"里可以看到用它们搭出来的页面。

| 组件 | 规范 | 状态 |
| --- | --- | --- |
| Field | [表单](form.md) | 已实现 |
| Input / Textarea | [表单](form.md) | 已实现（凹陷与描边两种） |
| Checkbox / Radio / Switch | [表单](form.md) | 已实现 |
| FilterChip | [数据展示](data-display.md) | 已实现 |
| Progress / ProgressRing / Spinner | [反馈](feedback.md) | 已实现 |
| Alert | [反馈](feedback.md) | 已实现 |
| Select | [表单](form.md) | 已实现（和第三期的浮层一起做的） |
| Combobox（组合框） | [表单](form.md) | 已实现（含多选与分组） |
| Toast | [反馈](feedback.md) | 已实现（同上） |
| Stepper、双标签开关 | [表单](form.md) | 已实现 |
| 菱形表单符号（方案 B） | [表单](form.md) | 已实现（全局开关 `data-choice="diamond"`） |

Select 的面板和 Toast 的容器都是浮层，需要定位与焦点管理，和第三期的浮层共用同一套无障碍基元（Base UI）。

### 第三期：浮层与导航

能搭出完整的应用外壳。在 Storybook 的"示例 / 调度台"里可以看到：宽屏是侧轨，窄屏换成顶栏和全屏菜单。

| 组件 | 规范 | 状态 |
| --- | --- | --- |
| Dialog | [浮层](overlay.md) | 已实现（含两处可选装饰） |
| Drawer | [浮层](overlay.md) | 已实现 |
| Tooltip | [浮层](overlay.md) | 已实现 |
| DropdownMenu | [浮层](overlay.md) | 已实现（含复选项与一层子菜单） |
| Popover（气泡卡片） | [浮层](overlay.md) | 已实现 |
| FlyoutBar（展开条） | [浮层](overlay.md) | 已实现 |
| Select / Toast | [表单](form.md)、[反馈](feedback.md) | 已实现（Select 含多选） |
| SideRail（侧轨） | [导航](navigation.md) | 已实现（展开与收起两种形态，含分组） |
| TopBar / NavMenu（顶栏与全屏菜单） | [导航](navigation.md) | 已实现 |
| NavAction（主行动块） | [导航](navigation.md) | 已实现 |
| Pagination / Navigator / DashIndicator | [导航](navigation.md) | 已实现 |
| Breadcrumb | [导航](navigation.md) | 已实现 |

### 第四期：数据与游戏风格

能搭出工具站、数据面板、游戏风格的界面。

| 组件 | 规范 | 状态 |
| --- | --- | --- |
| Table | [数据展示](data-display.md) | 已实现 |
| DataRow | [数据展示](data-display.md) | 已实现（`DataRowList` + `DataRow`） |
| Sparkline（行内的小型面积图） | [数据展示](data-display.md) | 已实现 |
| Stat | [数据展示](data-display.md) | 已实现 |
| ResourceChip / Countdown | [数据展示](data-display.md) | 已实现 |
| List / ListRow | [卡片](card.md) | 已实现（含深色行带 `band`） |
| Timeline | [数据展示](data-display.md) | 已实现 |
| ItemSlot | [卡片](card.md) | 已实现（含方向键导航的矩阵 `ItemGrid`） |
| EmptyState / Skeleton | [反馈](feedback.md) | 已实现 |
| Loader（加载页） | [反馈](feedback.md) | 已实现 |
| CompletionBanner、列表行的完成态 | [反馈](feedback.md) | 已实现 |
| Term（富文本的语义着色词） | [数据展示](data-display.md) | 已实现 |

### 第五期：母题组件（已实现）

把 [母题](../elements/corner-and-wedge.md) 做成可复用的装饰组件：

| 组件 | 规范 |
| --- | --- |
| GhostText | [镂空字与微文字](../elements/ghost-and-micro-text.md) |
| Hatch、HazardStripe、RegistrationStrip | [斜纹与色条](../elements/stripes-and-strips.md) |
| CornerBrackets | [括号与标记](../elements/brackets-and-markers.md) |
| Viewfinder、TickRing、ScrollHint、RecIndicator、Kbd | [测绘叠层](../elements/hud-overlays.md) |
| Marquee | [动效](../foundations/motion.md) |
| Texture（点阵、工程网格、等高线） | [网格、等高线、点阵](../elements/grid-contour-dots.md) |
| BracketTitle | [括号与标记](../elements/brackets-and-markers.md) |

切角、斜楔、角括号、镂空字、斜纹、警示条纹、三种底纹同时是 [utilities.css](../../../packages/ui/src/styles/utilities.css) 里的工具类；切角与斜楔只有工具类，没有组件——"形状是变体的一部分"，谁能切角由控件自己决定（目前是楔形页签和物品格的 `NEW` 签）。

这些放在最后，是因为它们最容易被滥用。先有扎实的基础组件，再提供装饰。

### 第六期：清单之外补的（已实现）

前五期做完之后补的。它们在最初的清单里没有——有的是官网上看得到、当时没列进来的（头像切换、媒体轮播、排期、播放钮），有的是搭真实页面时发现缺的。每一个都是先在对应的文档里写了规格、标了来源等级，再做的。表里从播放钮往下的五行是第二批；从行展开往下的五行是第三批——官网上没有它们的原型，是从库里已有的画法延伸出来的，每一行写了借的是哪一处。

| 组件 | 规范 | 依据 |
| --- | --- | --- |
| ContextMenu（右键菜单） | [浮层](overlay.md) | 推断：下拉菜单换一种触发方式 |
| Combobox 的远程检索与加载态 | [表单](form.md) | 推断 |
| Table 的表头吸顶 | [数据展示](data-display.md) | 推断 |
| Accordion（折叠面板） | [卡片](card.md) | 推断 |
| Slider（滑块，含范围） | [表单](form.md) | 推断 |
| Avatar（头像） | [数据展示](data-display.md) | 实测：官网的圆形头像与选中环 |
| AvatarSwitcher（头像切换） | [导航](navigation.md) | 观察：官网"干员情报"左侧那一列 |
| 反转块的局部主题 `data-theme="inverse"` | [色彩](../foundations/color.md#反转块里的局部主题) | 实现时定的机制，不是新的画法 |
| SideRailSub（侧轨的二级） | [导航](navigation.md) | 推断 |
| Carousel（媒体轮播） | [卡片](card.md) | 观察：官网"玩法介绍" |
| Calendar / DatePicker（月历与日期选择） | [表单](form.md) | 推断 |
| Schedule（排期） | [数据展示](data-display.md) | 观察：官网的版本日历 |
| PlayButton / PlayMark（播放钮），媒体卡的 `video` | [卡片](card.md#播放钮) | 实测：官网影像资料区的黄色小方块；摆在哪个角是推断 |
| BackToTop（回到顶部） | [导航](navigation.md#回到顶部) | 推断；悬停变信号黄取自分页条方钮的实测 |
| SegmentedControl（分段选择） | [表单](form.md#分段选择) | 推断：输入框的凹陷底 + 选中的填充反转 |
| Steps（步骤条） | [导航](navigation.md#步骤条) | 观察：宣传物料里"黑色章头 + 黄色重点"的步骤；三态沿用时间线的节点 |
| Calendar 的 `range`、DateRangePicker（日期范围） | [表单](form.md#选一段) | 推断：两端是选中格的填充反转，中间是墨色的浅带 |
| Table 的行展开、TableExpander | [数据展示](data-display.md#行展开) | 推断：排序用的小三角转 90°，明细区是凹陷的底 |
| Toolbar（工具栏） | [按钮](button.md#工具栏) | 推断：方形图标钮和"开关类工具"的墨底黄记号是实测，收成一条带子是延伸 |
| TagInput（标签输入） | [表单](form.md#标签输入) | 推断：输入框的外框 + 组合框多选的直角小块 |
| FileUpload / FileItem（文件上传） | [表单](form.md#文件上传) | 推断：空状态的虚线框、凹陷的底、取景角、直角标签、进度条 |
| Toc（页内目录） | [导航](navigation.md#页内目录) | 推断：侧轨二级的引线，当前项那一段换成粗条 |

## 不做什么

- **不做"万能卡片"。** 这套语言里的层次靠底色和线，不靠卡片嵌套。
- **不提供发光、玻璃拟态、霓虹描边的变体。**
- **不内置官方素材**：图标、Logo、立绘、字体都不进库。
- **不做滚动劫持和整页缩放。** 那是展示站的手法，由使用方在页面层决定。
- **不把游戏术语写进组件名。** 叫 `ItemSlot` 不叫 `OperatorCard`；业务组件由使用方组合。

## 参照

社区组件库 [ReEnd-Components](https://github.com/VBeatDead/ReEnd-Components) 已经实现了 75 个以上的组件，它的清单是很好的查漏依据。和它的主要差异：

| | ReEnd | 本规范 |
| --- | --- | --- |
| 默认主题 | 暗色 | 亮色，暗色可切 |
| 主黄 | `#FFD429` | `#FFFA00` |
| 气质 | 战术 HUD | 工业编辑 |
| 样式方案 | Tailwind v3 预设 | Tailwind v4 `@theme` |
| 表单符号 | 菱形 | 方形为默认，菱形可选 |
