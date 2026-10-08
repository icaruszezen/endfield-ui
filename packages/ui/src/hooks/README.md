# hooks

只放不依赖具体组件的逻辑。只服务于单个组件的 hook 放在该组件目录内。

| hook | 作用 |
| --- | --- |
| `useTheme` | 读写 `<html data-theme>`；支持 `light` / `dark` / `system`，选择记在 `localStorage` |
| `useControllableState` | 受控 / 非受控状态合并；值没变时不触发 `onChange` |
| `useInView` | 元素第一次进入视口后返回 `true`，之后不再变回去——入场动画只播一次 |
| `usePortalScope` | 浮层挂到 `<body>` 下之后拿不到局部容器上的 `data-theme` / `data-choice`：返回 `anchorRef`（给触发元素）和 `portalRef`（给浮层的容器），容器挂载时把最近的开关抄过去。`invertTheme` 抄相反的主题（文字提示） |

还没有 `useReducedMotion`：目前的动效都是 CSS 动画与过渡，由 [theme.css](../styles/theme.css) 末尾的全局规则统一降级。等出现用 JS 驱动的动效时再加。
