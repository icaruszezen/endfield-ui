# hooks

通用 React hooks 的预留位置，目前为空。

只放不依赖具体组件的逻辑，例如：

- `useReducedMotion`：读取 `prefers-reduced-motion`，供带动效的组件降级；
- `useTheme`：读写 `<html data-theme>`；
- `useControllableState`：受控 / 非受控状态合并。

只服务于单个组件的 hook 放在该组件目录内。
