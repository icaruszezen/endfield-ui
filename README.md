# endfield-ui

《明日方舟：终末地》设计风格指导文档，以及按这套文档实现的 React + Tailwind CSS v4 组件库。

> 非官方的爱好者项目，与鹰角网络（Hypergryph）无关。本仓库不包含任何官方素材。详见 [NOTICE](NOTICE.md)。

## 现在有什么

| | 状态 | 位置 |
| --- | --- | --- |
| 设计风格文档 | 可读 | [docs/](docs/README.md) |
| 设计令牌 | 草案，随组件一起使用 | [packages/ui/src/styles/theme.css](packages/ui/src/styles/theme.css) |
| 组件库 | 第一期基础控件已实现，适配亮 / 暗主题；尚未发布 | [packages/ui/](packages/ui/README.md) |
| 预览站 | Storybook，可并排对比亮暗两套；[在线预览](https://icaruszezen.github.io/endfield-ui/) | [apps/docs/](apps/docs/README.md) |

第一期的控件：Button、IconButton、Tag / TagPair、Badge、SectionTitle、Tabs、Panel。

```bash
pnpm install
```

```bash
pnpm dev
```

第二条命令启动 Storybook（`http://localhost:6106`）。其余命令见 [packages/ui/README.md](packages/ui/README.md)。

每次推送到 `main`，[GitHub Actions](.github/workflows/deploy.yml) 会跑类型检查、测试和构建，并把 Storybook 发布到 <https://icaruszezen.github.io/endfield-ui/>。

## 这套风格是什么

**工业编辑风**：纸白或烟黑的底、墨黑的字、一处高饱和的信号黄，再叠一层克制的印刷与测绘痕迹。

它不等于"黑底黄字加切角"。六条核心原则：

1. 纸与墨是主体，颜色是信号；
2. 主角偏心，信息靠边；
3. 形状有含义；
4. 中文负责阅读，英文负责结构；
5. 纹理有预算；
6. 动得短，动得硬。

展开见 [设计总纲](docs/design/overview.md)。

## 文档导览

```
docs/design/
├── overview.md      设计总纲
├── foundations/     基础：色彩、字体、形状、布局、动效、纹理、图标、图像
├── elements/        母题：切角、括号、斜纹、分节标题、镂空字、底纹、测绘叠层
├── surfaces/        载体：官网、游戏界面、宣传物料
├── components/      组件：按钮、导航、卡片、表单、反馈、浮层、数据展示
├── references/      依据：官网实测数据、官方来源、开源项目调研
└── assets/          原创 SVG 图解
```

完整索引与阅读建议见 [docs/README.md](docs/README.md)。

### 依据从哪来

- **官网**：直接测量 [endfield.hypergryph.com](https://endfield.hypergryph.com/) 的样式，原始数据记录在 [measurements.md](docs/design/references/measurements.md)。
- **游戏界面与宣传物料**：本仓库没有实机截图，这部分主要整理自社区开源项目的归纳，文档中一律标注为"社区"。
- **开源项目**：调研了 GitHub 上十余个相关项目，逐项记录了可借鉴之处与许可证，见 [open-source-projects.md](docs/design/references/open-source-projects.md)。

文档里的每条规范都标了来源等级（实测 / 观察 / 社区 / 推断），方便判断哪些是事实、哪些是建议。

## 目录结构

```
endfield-ui/
├── docs/                    设计风格文档
├── packages/
│   └── ui/                  组件库 @endfield-ui/react
│       └── src/
│           ├── components/  组件
│           ├── styles/      令牌、母题工具类、样式入口
│           ├── hooks/       通用 hooks
│           ├── lib/         工具函数
│           └── icons/       原创图标
├── apps/
│   └── docs/                Storybook 预览站
├── package.json
├── pnpm-workspace.yaml
├── NOTICE.md
└── LICENSE
```

仓库按 pnpm monorepo 组织，需要 Node 22 以上与 pnpm 10。

## 使用组件

包还没有发布，目前在本仓库的工作区里使用。样式入口一行，然后直接用组件：

```css
@import "@endfield-ui/react/tailwind.css";
```

```tsx
import { Button, Tag } from "@endfield-ui/react";

<Button variant="action">前往游戏</Button>
<Tag variant="outline">限时活动</Tag>
```

默认亮色；在 `<html>` 或任意容器上加 `data-theme="dark"` 切到暗色。不用 Tailwind 的项目、主题切换的 hook 等见 [packages/ui/README.md](packages/ui/README.md)。

## 只使用设计令牌

令牌文件可以独立于组件使用。在一个已经装好 Tailwind CSS v4 的项目里：

```css
@import "tailwindcss";
@import "./theme.css"; /* 从 packages/ui/src/styles/ 复制 */
```

```html
<html data-theme="dark">
  <body class="bg-surface font-sans text-ink">
    <button class="bg-action px-6 py-3 text-lg font-medium text-on-action">
      前往游戏
    </button>
  </body>
</html>
```

注意：`theme.css` 会清掉 Tailwind 的默认色板、圆角、阴影与字阶，只保留这套系统自己的令牌。各令牌的含义见 [色彩](docs/design/foundations/color.md)、[字体](docs/design/foundations/typography.md)、[形状](docs/design/foundations/shape.md)、[动效](docs/design/foundations/motion.md)。

## 路线

1. ~~设计风格文档与令牌草案~~
2. ~~初始化工程（`package.json`、构建、测试）~~
3. ~~第一期组件：按钮、图标按钮、标签与角标、分节标题、页签、面板~~
4. 文档站——组件预览（Storybook）已有；把设计文档渲染成站点还没做
5. 表单与反馈 → 浮层与导航 → 数据与游戏风格 → 母题组件

各期的组件清单见 [组件规范](docs/design/components/README.md)。

## 参与

欢迎补充与校正，尤其是：

- 游戏界面的实机观察（目前证据最薄的部分）；
- 官网改版后的重新测量；
- 文档中标为"推断"的数值的更好依据。

请只提交原创内容，不要提交官方截图、立绘、Logo、图标或字体文件。

## 许可

仓库内的原创内容以 [MIT License](LICENSE) 发布。《明日方舟：终末地》及其全部官方素材的权利归鹰角网络所有，不在本许可范围内，详见 [NOTICE](NOTICE.md)。
