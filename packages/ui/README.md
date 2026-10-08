# packages/ui

终末地风格 React 组件库的预留位置。**目前只有设计令牌草案，没有组件。**

## 计划中的技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS v4（CSS-first，`@theme` 令牌，不使用 `tailwind.config.js`） |
| 无障碍基元 | 待定（Radix UI / React Aria / Base UI 三选一，写第一个浮层组件前决定） |
| 构建 | 待定（tsup 或 Vite library mode） |
| 包名 | 待定 |

## 目录约定

```
packages/ui/
└── src/
    ├── components/   一组件一目录，见 components/README.md
    ├── styles/       令牌与全局样式，见 styles/README.md
    ├── hooks/        与组件无关的通用 hooks
    ├── lib/          纯函数工具（类名合并、键盘导航等）
    └── icons/        原创图标组件，不收录官方图标
```

## 与设计文档的关系

- 所有视觉决策以 [docs/design](../../docs/design/overview.md) 为准；代码里出现文档没有的颜色或尺寸时，先改文档再改代码。
- 组件的状态、尺寸与形状规范在 [docs/design/components](../../docs/design/components/README.md)，那里同时给出了建议的实现顺序。
- 令牌的唯一来源是 [src/styles/theme.css](src/styles/theme.css)，文档中的令牌表与它逐项对应。

## 开始开发前需要补的东西

本目录有意不放 `package.json`。启动组件库开发时再初始化：

1. 根目录 `package.json`（`private: true`，声明 `packageManager`）与本包的 `package.json`；
2. `tsconfig`、构建与测试配置；
3. `src/index.ts` 入口与 `src/styles/index.css`（引入 `tailwindcss` 与 `theme.css`）。
