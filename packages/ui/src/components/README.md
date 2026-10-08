# components

| 目录 | 导出 | 规范 |
| --- | --- | --- |
| `button/` | `Button`、`ButtonGroup` | [按钮](../../../../docs/design/components/button.md) |
| `icon-button/` | `IconButton` | [按钮](../../../../docs/design/components/button.md) |
| `tag/` | `Tag`、`TagPair` | [数据展示](../../../../docs/design/components/data-display.md) |
| `badge/` | `Badge` | [数据展示](../../../../docs/design/components/data-display.md) |
| `chip/` | `FilterChip`、`ResourceChip` | [数据展示](../../../../docs/design/components/data-display.md) |
| `countdown/` | `Countdown` | [数据展示](../../../../docs/design/components/data-display.md) |
| `stat/` | `Stat` | [数据展示](../../../../docs/design/components/data-display.md) |
| `section-title/` | `SectionTitle` | [分节标题](../../../../docs/design/elements/section-title.md) |
| `kbd/` | `Kbd` | [测绘叠层](../../../../docs/design/elements/hud-overlays.md) |
| `tabs/` | `Tabs`、`TabList`、`Tab`、`TabPanel`（格子、胶囊、楔形三种） | [导航](../../../../docs/design/components/navigation.md) |
| `breadcrumb/` | `Breadcrumb`、`BreadcrumbItem` | [导航](../../../../docs/design/components/navigation.md) |
| `pagination/` | `Pagination` | [导航](../../../../docs/design/components/navigation.md) |
| `navigator/` | `Navigator` | [导航](../../../../docs/design/components/navigation.md) |
| `dash-indicator/` | `DashIndicator` | [导航](../../../../docs/design/components/navigation.md) |
| `panel/` | `Panel`、`PanelHeader`、`PanelBody`、`PanelRows`、`PanelRow` | [卡片](../../../../docs/design/components/card.md) |
| `list/` | `List`、`ListRow` | [卡片](../../../../docs/design/components/card.md) |
| `media-card/` | `MediaCard` | [卡片](../../../../docs/design/components/card.md) |
| `item-slot/` | `ItemSlot` | [卡片](../../../../docs/design/components/card.md) |
| `timeline/` | `Timeline`、`TimelineItem` | [数据展示](../../../../docs/design/components/data-display.md) |
| `field/` | `Field`、`useFieldControl`、`useFieldContext` | [表单](../../../../docs/design/components/form.md) |
| `input/` | `Input` | [表单](../../../../docs/design/components/form.md) |
| `textarea/` | `Textarea` | [表单](../../../../docs/design/components/form.md) |
| `checkbox/` | `Checkbox`（可整体换成菱形符号） | [表单](../../../../docs/design/components/form.md) |
| `radio/` | `RadioGroup`、`Radio`（同上） | [表单](../../../../docs/design/components/form.md) |
| `switch/` | `Switch`（含双标签开关） | [表单](../../../../docs/design/components/form.md) |
| `stepper/` | `Stepper` | [表单](../../../../docs/design/components/form.md) |
| `alert/` | `Alert` | [反馈](../../../../docs/design/components/feedback.md) |
| `progress/` | `Progress`、`ProgressRing` | [反馈](../../../../docs/design/components/feedback.md) |
| `skeleton/` | `Skeleton` | [反馈](../../../../docs/design/components/feedback.md) |
| `empty-state/` | `EmptyState` | [反馈](../../../../docs/design/components/feedback.md) |
| `loader/` | `Loader` | [反馈](../../../../docs/design/components/feedback.md) |
| `spinner/` | `Spinner` | [反馈](../../../../docs/design/components/feedback.md) |
| `completion-banner/` | `CompletionBanner` | [反馈](../../../../docs/design/components/feedback.md) |
| `rec-indicator/` | `RecIndicator` | [测绘叠层](../../../../docs/design/elements/hud-overlays.md) |
| `marquee/` | `Marquee` | [动效](../../../../docs/design/foundations/motion.md) |
| `scroll-hint/` | `ScrollHint` | [测绘叠层](../../../../docs/design/elements/hud-overlays.md) |
| `corner-brackets/` | `CornerBrackets` | [括号与标记](../../../../docs/design/elements/brackets-and-markers.md) |
| `viewfinder/` | `Viewfinder` | [测绘叠层](../../../../docs/design/elements/hud-overlays.md) |
| `tick-ring/` | `TickRing` | [测绘叠层](../../../../docs/design/elements/hud-overlays.md) |
| `ghost-text/` | `GhostText` | [镂空字与微文字](../../../../docs/design/elements/ghost-and-micro-text.md) |
| `hatch/` | `Hatch` | [斜纹与色条](../../../../docs/design/elements/stripes-and-strips.md) |
| `hazard-stripe/` | `HazardStripe` | [斜纹与色条](../../../../docs/design/elements/stripes-and-strips.md) |
| `registration-strip/` | `RegistrationStrip` | [斜纹与色条](../../../../docs/design/elements/stripes-and-strips.md) |

几个目录里有不对外导出的样式文件，供外观相同的控件共用，免得两边走样：

| 文件 | 谁在用 |
| --- | --- |
| `chip/capsule-style.ts` | `FilterChip`、`Tabs` 的 `capsule` 变体 |
| `input/control-box.ts` | `Input`、`Textarea` 的外框（凹陷与描边两种） |
| `checkbox/choice-style.ts` | `Checkbox`、`Radio`、`Switch` 的行与方格（含菱形方案的写法） |
| [`lib/decor.ts`](../lib/decor.ts) | 所有装饰层：不挡点击、不可选中，高对比模式与打印时去掉 |

## 约定

一组件一目录，目录名用 kebab-case，组件名用 PascalCase：

```
components/
└── button/
    ├── Button.tsx        组件实现
    ├── Button.test.tsx   行为与无障碍测试
    └── index.ts          具名导出
```

预览用的 stories 不放在这里，放在 [apps/docs/stories](../../../../apps/docs/README.md)，保持依赖方向 `apps/docs → packages/ui`。

- 只用 [theme.css](../styles/theme.css) 里的令牌生成的工具类；组件内不写十六进制色值。
- 随主题翻转的颜色一律用语义令牌（`surface`、`ink`、`action`…）。只有"有意不随主题变"的填充才直接用 `neutral-*`，并在旁边写一句注释说明原因。
- 压在反转块（`surface-inverse`）上的强调记号用 `accent-ink-inverse`，压在页面表面上的用 `accent-ink`，都不直接用 `action`：它在浅色底上看不见。
- 悬停底用 `hover:bg-ink/5`，不用 `surface-sunken`——后者在暗色主题下是纯黑。
- 组件 API 用语义命名（`variant="action"`、`tone="danger"`），不把颜色名写进属性（不要 `yellow`）。
- 变体写成 `Record<Variant, string>`，用 [`cn()`](../lib/cn.ts) 合并，使用方传入的 `className` 排在最后、可以覆盖内置类。
- 形状是语义的一部分：切角、胶囊、圆形分别对应什么含义见 [形状规范](../../../../docs/design/foundations/shape.md)，不要给所有组件套同一个外形。
- 每个交互组件都要有 `:focus-visible` 样式，用 [`focusRing`](../lib/focus-ring.ts)；会被滚动容器裁切的地方用 `focusRingInset`；外框自己不能聚焦、里面的控件能（输入框）时用 `focusRingWithin`。焦点环不能被 `clip-path` 裁掉（做法见 [切角与斜楔](../../../../docs/design/elements/corner-and-wedge.md)）。
- 悬停用 Tailwind 的 `hover:`，它只在有指针的设备上生效。
- 组件内部的响应式看**自身宽度**，用容器查询（`@container` + `@md:` 这类变体），不用视口断点（`md:`）：组件不知道自己会被放进多窄的栏里。视口断点只留给"必须和页面布局同步切换"的地方，目前只有 `SectionTitle` 的 `side` 形态。
- 会出现英文长单词的大号文字加 `wrap-anywhere` 兜底，并确保它所在的弹性子项能收缩（`min-w-0` 或 `max-w-full`）。有意不换行的控件（按钮、标签、页签）除外。
- 装饰元素（竖条、箭头、分隔线）加 `aria-hidden`。
- 动效遵守 `prefers-reduced-motion`：降级后内容必须停在终态。循环动画停下来的样子不能被看成一个具体的值：不确定进度的色块停在正中，进度环换成一圈虚线。
- 用 `group` / `peer` 时给 `group` 起名字（`group/card` + `group-hover/card:`）：不起名的 `group-hover:` 会被外层任何一个 `group` 的悬停带着走，控件一旦被放进别的可悬停容器就会出错。
- `z-index` 不在组件里写数值，用 [theme.css](../styles/theme.css) 里的层叠变量（目前只有加载页的 `--z-loader`）。

### 母题与装饰

- **切角和斜楔画在伪元素的底上，不直接裁可聚焦的元素。** `clip-path` 会把焦点环一起裁掉，所以写成 `relative isolate before:absolute before:inset-0 before:-z-10 before:wedge-r before:bg-action`（楔形页签就是这样）。不可聚焦的小东西（角标）可以直接写 `cut-br`。
- **角括号画在宿主之外 4px。** 宿主自己要定位，并且不能被贴身的祖先裁切：需要裁切内容时把裁切放到内层（物品格的卡面），括号留在外层。选中又被聚焦时，焦点环外移到括号之外（`focus-visible:outline-offset-[6px]`）。
- **纯装饰的元素加 `aria-hidden` 并用 [`decor`](../lib/decor.ts)。** 用背景画出来的状态（角括号）在高对比模式下不显示，要另给一个描边之类的替代。
- **装饰不压字。** 描边词、巨字放在空白处，或者排在两段文字之间，或者朝文字的方向淡出；不要从标题、说明、数值后面穿过去——再淡的线也会切碎字的轮廓。
- **叠在画面上的控件颜色跟画面走。** 取景角、刻度圆环、录制指示用的都是 `ink`，压在深色图像上时由使用方给它加 `data-theme="dark"`，组件自己不猜。
- **全库只能选一套的外观做成全局开关，不做成属性。** 菱形表单符号是 `<html data-choice="diamond">`，写法是自定义变体 `choice-diamond:`——做成属性的话，两套符号迟早会被混着用。

### 带状态的控件

- 受控与非受控两种用法都要支持，用 [`useControllableState`](../hooks/useControllableState.ts)：`value` / `defaultValue` / `onValueChange`（分页是 `page`，导航器是 `index`）。
- 页码从 1 起，其余的位置（`index`）从 0 起。
- 越界的值夹回范围内，不抛错。
- 会变的位置信息用 `aria-live="polite"` 播报一句完整的话（"第 2 页，共 12 页"），看得见的 `02 / 12` 对读屏隐藏。
- 输入到一半的内容单独存一份草稿，失焦或回车时才落定——边输入边校正会让人打不出想要的数（步进器、分页的跳页）。

### 表单控件

- 建立在原生 `<input>` / `<textarea>` 上：`className` 给外层（外框或整行），其余属性与 `ref` 给原生元素。
- 状态用原生伪类写样式（`checked:`、`disabled:`、`indeterminate:`），不另外维护一份 React 状态。
- 同一个元素上几个状态类互相覆盖时，谁赢取决于它们在生成的 CSS 里的先后，而不是写在 `className` 里的先后。目前依赖的顺序是 `group-hover` < `checked` / `indeterminate` < `hover` < `disabled`；`hover` 排在 `focus-within` 之后，所以输入框的悬停写成 `hover:not-focus-within:`。
- `:indeterminate` 也会命中"一组里都没选"的单选框，半选的样式只能写在复选框上。
- 需要标签、帮助文字、错误说明时放进 [`Field`](field/Field.tsx)；自定义控件用 `useFieldControl` 接入。

各组件的设计规范与各期的清单见 [docs/design/components](../../../../docs/design/components/README.md)。
