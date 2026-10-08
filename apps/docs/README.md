# apps/docs

组件预览站，用 Storybook 10（`@storybook/react-vite`）。

在仓库根目录：

```bash
pnpm dev
```

打开 `http://localhost:6106`。`pnpm build:docs` 生成静态站点到 `storybook-static/`。

在线版本：<https://icaruszezen.github.io/endfield-ui/>。每次推送到 `main`，[.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) 会先跑类型检查、测试和组件库构建，全部通过后再构建 Storybook 并发布到 GitHub Pages；任何一步失败都不会发布。也可以在仓库的 Actions 页面手动触发。

## 现在有什么

- `stories/` 下每个组件一个文件，覆盖变体、尺寸、状态；
- **示例 / 内容页**：用第一期的控件搭出的一个官网气质的页面；
- **示例 / 主题色接管**：局部把强调色换成青色。

工具栏上的**主题**开关有三档：亮色、暗色、**并排**（默认）。并排模式把同一个 story 渲染进两个局部主题容器，用来对比两套取值；亮色 / 暗色模式把主题写到 `<html>`，和真实页面的用法一致。

## 怎么接的

- `.storybook/main.ts` 把 `@endfield-ui/react` 别名到 `packages/ui/src/index.ts`，所以改组件源码即热更新，不用先构建。
- `.storybook/preview.css` 引入 `@endfield-ui/react/tailwind.css`，再用 `@source` 把 stories 里的类名交给 Tailwind。
- `.storybook/preview-head.html` 从 Google Fonts 加载 Archivo、Outfit、Space Grotesk 三款开源字体；断网时回退到系统字体，层级关系仍然成立。

## 还没做的

- 把 [docs/design](../../docs/design/overview.md) 里的规范渲染成可浏览的页面，令牌表直接读取 `packages/ui/src/styles/theme.css`。

## 约束

- 演示内容用原创占位图与虚构文案，不使用官方截图、立绘、Logo 和字体，见 [NOTICE](../../NOTICE.md)。
- 文档站代码不被 `packages/ui` 依赖；依赖方向只能是 `apps/docs → packages/ui`。stories 因此放在这里，而不是组件目录里。
