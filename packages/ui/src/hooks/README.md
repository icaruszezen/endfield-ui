# hooks

只放不依赖具体组件的逻辑。只服务于单个组件的 hook 放在该组件目录内。

| hook | 作用 |
| --- | --- |
| `useTheme` | 读写 `<html data-theme>`；支持 `light` / `dark` / `system`，选择记在 `localStorage` |
| `useControllableState` | 受控 / 非受控状态合并；值没变时不触发 `onChange` |
| `useInView` | 元素第一次进入视口后返回 `true`，之后不再变回去——入场动画只播一次 |
| `useReducedMotion` | 系统开了"减少动态效果"时返回 `true`，设置变了跟着变。只给脚本驱动的动效用（滚动数字）：CSS 的动画和过渡不用它 |
| `usePresence` | 退场后再卸载：`open` 变成假之后元素先留着，等它身上正在跑的过渡和动画走完才卸载；没有动效可等就当场卸载。另外告诉你这个元素是不是"后来才出现的"——一开始就在的不播进场。加载页的滑出在用。不对外导出 |
| `useOverflowing` | 容器里的内容是不是比容器宽、比容器高。给"只有真的能滚动时才是一个能聚焦的区域"用（表格、排期）。不对外导出 |
| `useScrollPosition` | 盯着一个滚动容器（不传就是整个页面），由滚动位置算出一个值：滚动、窗口尺寸变了、内容晚到都会重新算，值没变不重新渲染。滚动提示和回到顶部共用。不对外导出 |
| `usePortalScope` | 浮层挂到 `<body>` 下之后拿不到局部容器上的 `data-theme` / `data-choice`：返回 `anchorRef`（给触发元素）和 `portalRef`（给浮层的容器），容器挂载时把最近的开关抄过去。`invertTheme` 抄相反的主题（文字提示）。最近的是反转块（`data-theme="inverse"`）时，抄的是它实际算出来的亮或暗 |

动效几乎都是 CSS 的动画与过渡，由 [theme.css](../styles/theme.css) 末尾的全局规则统一降级，不用在组件里判断。那条规则管不到脚本：一帧一帧自己算的动效（现在只有滚动数字）要用 `useReducedMotion` 自己看。
