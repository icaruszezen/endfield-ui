# components

组件源码的预留位置，目前为空。

## 约定

一组件一目录，目录名用 kebab-case，组件名用 PascalCase：

```
components/
└── button/
    ├── Button.tsx        组件实现
    ├── Button.test.tsx   行为与无障碍测试
    └── index.ts          具名导出
```

- 只用 [theme.css](../styles/theme.css) 里的令牌生成的工具类；组件内不写十六进制色值。
- 组件 API 用语义命名（`variant="action"`、`tone="danger"`），不把颜色名写进属性（不要 `yellow`）。
- 形状是语义的一部分：切角、胶囊、圆形分别对应什么含义见 [形状规范](../../../../docs/design/foundations/shape.md)，不要给所有组件套同一个外形。
- 每个交互组件都要有 `:focus-visible` 样式，且不能被 `clip-path` 裁掉（做法见 [切角与斜楔](../../../../docs/design/elements/corner-and-wedge.md)）。
- 动效遵守 `prefers-reduced-motion`。

各组件的设计规范与建议实现顺序见 [docs/design/components](../../../../docs/design/components/README.md)。
