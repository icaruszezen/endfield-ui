# lib

纯函数与常量。这里不放 React 组件和 hooks。

| 文件 | 内容 |
| --- | --- |
| `cn.ts` | `cn()`：合并类名（`clsx` + `tailwind-merge`）。里面登记了 [theme.css](../styles/theme.css) 的自定义令牌名，否则 `text-micro` 会被当成颜色、与 `text-ink` 互相覆盖 |
| `focus-ring.ts` | `focusRing`、`focusRingInset`、`focusRingWithin`：全库统一的焦点环类名 |
| `merge-refs.ts` | `mergeRefs()`：组件自己要用节点、同时还得把它交给使用方时，把几个 ref 合成一个 |
| `defined.ts` | `defined()`：去掉值是 `undefined` 的属性。把控件的属性合并到使用方给的元素上（`render`）之前用，免得把那个元素自己写的盖掉 |
| `decor.ts` | `decor`：装饰层共用的类 |
| `motion.ts` | 几处共用的动效类名。`enterFromSide`：浮层面板进场的方向位移——按基元给的 `data-side`，起点往触发元素那一侧偏 `--motion-shift`；`collapse` / `collapseEnter` / `collapseInner`：按高度收放；`fadeInFast`：小件的淡入；`indicator` / `indicatorBox`：画在容器 `::after` 上的选中指示，位置来自 `useIndicator`。见 [动效](../../../../docs/design/foundations/motion.md#补的几条约定) |
| `date.ts` | 日期的纯函数：加减日和月、比较、把两天排成先后、夹到范围内、月历的六行七列。日期一律是 `YYYY-MM-DD` 的字符串，全部按 UTC 算，不碰本地时区。`Calendar`、`DatePicker`、`Schedule` 共用，不对外导出 |
| `file.ts` | 文件的纯函数：按 `accept` 认类型（扩展名、MIME、`image/*` 通配）、把字节数写成 `1.2 MB`、取扩展名、判断是不是同一个文件。`FileUpload` 用，不对外导出 |

没有单独的"变体工具"：各组件直接写 `Record<Variant, string>` 再用 `cn()` 合并，够用且类型清楚。

以后可能放进来的：与 DOM 无关的格式化函数，例如把数字格式化成等宽的 `01 / 04`。
