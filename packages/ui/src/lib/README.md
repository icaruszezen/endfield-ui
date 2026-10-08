# lib

纯函数与常量。这里不放 React 组件和 hooks。

| 文件 | 内容 |
| --- | --- |
| `cn.ts` | `cn()`：合并类名（`clsx` + `tailwind-merge`）。里面登记了 [theme.css](../styles/theme.css) 的自定义令牌名，否则 `text-micro` 会被当成颜色、与 `text-ink` 互相覆盖 |
| `focus-ring.ts` | `focusRing`、`focusRingInset`、`focusRingWithin`：全库统一的焦点环类名 |
| `merge-refs.ts` | `mergeRefs()`：组件自己要用节点、同时还得把它交给使用方时，把几个 ref 合成一个 |

没有单独的"变体工具"：各组件直接写 `Record<Variant, string>` 再用 `cn()` 合并，够用且类型清楚。

以后可能放进来的：与 DOM 无关的格式化函数，例如把数字格式化成等宽的 `01 / 04`。
