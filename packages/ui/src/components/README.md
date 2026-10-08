# components

| 目录 | 导出 | 规范 |
| --- | --- | --- |
| `button/` | `Button` | [按钮](../../../../docs/design/components/button.md) |
| `icon-button/` | `IconButton` | [按钮](../../../../docs/design/components/button.md) |
| `tag/` | `Tag`、`TagPair` | [数据展示](../../../../docs/design/components/data-display.md) |
| `badge/` | `Badge` | [数据展示](../../../../docs/design/components/data-display.md) |
| `section-title/` | `SectionTitle` | [分节标题](../../../../docs/design/elements/section-title.md) |
| `tabs/` | `Tabs`、`TabList`、`Tab`、`TabPanel` | [导航](../../../../docs/design/components/navigation.md) |
| `panel/` | `Panel`、`PanelHeader`、`PanelBody`、`PanelRows`、`PanelRow` | [卡片](../../../../docs/design/components/card.md) |

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
- 组件 API 用语义命名（`variant="action"`、`tone="danger"`），不把颜色名写进属性（不要 `yellow`）。
- 变体写成 `Record<Variant, string>`，用 [`cn()`](../lib/cn.ts) 合并，使用方传入的 `className` 排在最后、可以覆盖内置类。
- 形状是语义的一部分：切角、胶囊、圆形分别对应什么含义见 [形状规范](../../../../docs/design/foundations/shape.md)，不要给所有组件套同一个外形。
- 每个交互组件都要有 `:focus-visible` 样式，用 [`focusRing`](../lib/focus-ring.ts)；会被滚动容器裁切的地方用 `focusRingInset`。焦点环不能被 `clip-path` 裁掉（做法见 [切角与斜楔](../../../../docs/design/elements/corner-and-wedge.md)）。
- 悬停用 Tailwind 的 `hover:`，它只在有指针的设备上生效。
- 组件内部的响应式看**自身宽度**，用容器查询（`@container` + `@md:` 这类变体），不用视口断点（`md:`）：组件不知道自己会被放进多窄的栏里。视口断点只留给"必须和页面布局同步切换"的地方，目前只有 `SectionTitle` 的 `side` 形态。
- 会出现英文长单词的大号文字加 `wrap-anywhere` 兜底，并确保它所在的弹性子项能收缩（`min-w-0` 或 `max-w-full`）。有意不换行的控件（按钮、标签、页签）除外。
- 装饰元素（竖条、箭头、分隔线）加 `aria-hidden`。
- 动效遵守 `prefers-reduced-motion`：降级后内容必须停在终态。

各组件的设计规范与各期的清单见 [docs/design/components](../../../../docs/design/components/README.md)。
