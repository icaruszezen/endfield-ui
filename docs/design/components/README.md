# 组件规范

把基础规范落到具体控件上：每个组件长什么样、有哪些状态、多大。这里是 [`packages/ui`](../../../packages/ui/README.md) 的设计输入。**第一期、第二期，以及后面几期里不依赖浮层与切角的控件已经实现**，各期清单里逐项标了状态；没标"已实现"的还只有规范。

## 怎么读

| 文档 | 覆盖的组件 |
| --- | --- |
| [按钮](button.md) | 按钮、图标按钮、按钮组 |
| [导航](navigation.md) | 侧轨、顶栏、页签、分页、胶囊导航器、面包屑 |
| [卡片](card.md) | 面板、媒体卡、物品格、列表行 |
| [表单](form.md) | 输入框、下拉、复选、单选、开关、步进器 |
| [反馈](feedback.md) | 进度、提示条、轻提示、加载、空状态 |
| [浮层](overlay.md) | 弹窗、抽屉、下拉菜单、文字提示 |
| [数据展示](data-display.md) | 标签与徽章、数据行带、统计块、表格、时间线 |

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
- **压在反转块上的强调记号用 `accent-ink-inverse`，不直接用 `action`。** `surface-inverse` 在暗色主题下是近白，黄色压在上面看不见。面板标题带的竖条、已选的复选与单选、开启的开关都是这一条。
- **压在页面表面上的强调记号用 `accent-ink`。** 行动色在亮色表面上同样看不见（必填标记）。
- **悬停底用 `bg-ink/5`，不用 `surface-sunken`。** 后者在暗色主题下是纯黑，悬停会变暗而选中变亮，方向相反（页签、列表行）。

### 无障碍

- 用原生元素（`button`、`a`、`input`、`dialog`）或成熟的无障碍基元。
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
| Tabs | [导航](navigation.md) | 激活时文字让位给箭头 |
| Panel | [卡片](card.md) | 直角、1px 线、无阴影 |

这一期当时没做、后来补上的：列表行、媒体卡、胶囊族的筛选 / 资源 / 倒计时徽章、增益签、日期块的小红角。仍然没做的：物品格（[卡片](card.md)）、页签的 `wedge` 变体——都要等切角工具类。

### 第二期：表单与反馈

能搭出设置页、表单页、列表页。在 Storybook 的"示例 / 设置页"和"示例 / 列表页"里可以看到用它们搭出来的页面。

| 组件 | 规范 | 状态 |
| --- | --- | --- |
| Field | [表单](form.md) | 已实现 |
| Input / Textarea | [表单](form.md) | 已实现（凹陷与描边两种） |
| Checkbox / Radio / Switch | [表单](form.md) | 已实现 |
| FilterChip | [数据展示](data-display.md) | 已实现 |
| Progress / ProgressRing | [反馈](feedback.md) | 已实现 |
| Alert | [反馈](feedback.md) | 已实现 |
| Select | [表单](form.md) | 未做，挪到第三期 |
| Toast | [反馈](feedback.md) | 未做，挪到第三期 |
| Stepper、双标签开关 | [表单](form.md) | 已实现 |
| 菱形表单符号（方案 B） | [表单](form.md) | 未做，和母题组件一起做 |

Select 的面板和 Toast 的容器都是浮层，需要定位与焦点管理。它们和第三期的浮层共用同一套无障碍基元，所以等基元选定后一起做。

### 第三期：浮层与导航

能搭出完整的应用外壳。

| 组件 | 规范 | 状态 |
| --- | --- | --- |
| Dialog | [浮层](overlay.md) | |
| Drawer | [浮层](overlay.md) | |
| DropdownMenu / Tooltip | [浮层](overlay.md) | |
| Select / Toast | [表单](form.md)、[反馈](feedback.md) | 从第二期挪来 |
| SideRail / TopBar | [导航](navigation.md) | |
| Pagination / Navigator / DashIndicator | [导航](navigation.md) | 已实现 |
| Breadcrumb | [导航](navigation.md) | 已实现 |

### 第四期：数据与游戏风格

能搭出工具站、数据面板、游戏风格的界面。

| 组件 | 规范 | 状态 |
| --- | --- | --- |
| Table | [数据展示](data-display.md) | |
| DataRow | [数据展示](data-display.md) | |
| Stat | [数据展示](data-display.md) | 已实现 |
| ResourceChip / Countdown | [数据展示](data-display.md) | 已实现 |
| List / ListRow | [卡片](card.md) | 已实现 |
| Timeline | [数据展示](data-display.md) | 已实现 |
| ItemSlot | [卡片](card.md) | |
| EmptyState / Skeleton | [反馈](feedback.md) | 已实现 |
| Loader（加载页） | [反馈](feedback.md) | 已实现 |

### 第五期：母题组件

把 [母题](../elements/corner-and-wedge.md) 做成可复用的装饰组件：GhostText、Hatch、RegistrationStrip、TickRing、CornerBrackets、Viewfinder、Marquee、ScrollHint。

Marquee 与 ScrollHint 已实现：它们只用到现成的动画，不依赖切角。其余几个要先把切角、角括号落进 [utilities.css](../../../packages/ui/src/styles/utilities.css)。

这些放在最后，是因为它们最容易被滥用。先有扎实的基础组件，再提供装饰。

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
