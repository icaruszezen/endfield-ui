# apps/docs

组件预览与文档站的预留位置，目前为空。

## 计划

- 展示 `packages/ui` 的每个组件：变体、状态、亮 / 暗主题、键盘操作。
- 把 [docs/design](../../docs/design/overview.md) 里的规范渲染成可浏览的页面，令牌表直接读取 `packages/ui/src/styles/theme.css`，避免文档与代码不一致。
- 技术选型待定（Vite + React，或 Storybook / Ladle）。

## 约束

- 文档站本身也遵守 [NOTICE](../../NOTICE.md)：演示内容用原创占位图与虚构文案，不使用官方截图、立绘、Logo 和字体。
- 文档站代码不被 `packages/ui` 依赖；依赖方向只能是 `apps/docs → packages/ui`。
