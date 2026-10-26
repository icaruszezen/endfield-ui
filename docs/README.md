# 文档

《明日方舟：终末地》设计风格指导文档。非官方，详见 [NOTICE](../NOTICE.md)。

在线读：<https://icaruszezen.github.io/endfield-ui/design/>——同一批文档渲染成的站点，带目录、页内目录和搜索。站点的目录就取自下面的"全部文档"，加一篇文档要在那里加一行（见 [apps/site](../apps/site/README.md)）。

## 从哪里开始

| 你想 | 读 |
| --- | --- |
| 快速了解这套风格 | [设计总纲](design/overview.md) |
| 做一个官网气质的页面 | [官网](design/surfaces/website.md) → [色彩](design/foundations/color.md) → [分节标题](design/elements/section-title.md) |
| 做下载页、产品落地页 | [云游戏页](design/surfaces/cloud.md) → [按钮](design/components/button.md) → [斜纹与色条](design/elements/stripes-and-strips.md) |
| 做游戏风格的界面 | [游戏界面](design/surfaces/game-ui.md) → [形状](design/foundations/shape.md) → [切角与斜楔](design/elements/corner-and-wedge.md) |
| 做一张长图或活动页 | [宣传物料](design/surfaces/promotional.md) → [纹理](design/foundations/texture.md) |
| 用现成的组件 | [packages/ui](../packages/ui/README.md) |
| 用照游戏内界面复刻的那一组控件 | [Game 实机风格](design/game/README.md)——独立入口，带官方图片，先读里面的风险一节 |
| 接着写组件 | [组件规范](design/components/README.md) → [组件约定](../packages/ui/src/components/README.md) → [theme.css](../packages/ui/src/styles/theme.css) |
| 给控件加动效，或者想知道某处为什么这么动 | [动效](design/foundations/motion.md) → [动效补全计划](motion-plan.md)——35 步都做完了，留着的是每一步怎么定的 |
| 核对某个数值的依据 | [官网实测数据](design/references/measurements.md)；云游戏页的看 [云游戏页实测数据](design/references/measurements-cloud.md) |

## 全部文档

### 总纲

- [设计总纲](design/overview.md)——定位、三个载体、六条原则、常见误区

### 基础

单看一个维度。

- [色彩](design/foundations/color.md)——中性阶、信号黄、角色色、亮暗主题、对比度
- [字体](design/foundations/typography.md)——四种字体角色、字阶、中英搭配
- [形状](design/foundations/shape.md)——四类形状的语义、圆角、线、阴影
- [布局与空间](design/foundations/layout.md)——偏心构图、页面骨架、尺寸体系、断点
- [动效](design/foundations/motion.md)——时长与缓动、交互反馈的套路、标志性动画
- [纹理与装饰](design/foundations/texture.md)——纹理清单、强度、预算
- [图标](design/foundations/iconography.md)——网格与画法、状态
- [图像](design/foundations/imagery.md)——人物图、等距线稿、点云、主视觉接管

### 母题

单个标志性元素怎么画、什么时候不用。

- [切角与斜楔](design/elements/corner-and-wedge.md)
- [括号与标记](design/elements/brackets-and-markers.md)
- [斜纹与色条](design/elements/stripes-and-strips.md)
- [分节标题](design/elements/section-title.md)
- [镂空字与微文字](design/elements/ghost-and-micro-text.md)
- [网格、等高线、点阵](design/elements/grid-contour-dots.md)
- [测绘叠层](design/elements/hud-overlays.md)

### 载体

三种载体各自的整体面貌；官网的云游戏页单独一篇。

- [官网](design/surfaces/website.md)——证据等级：实测
- [云游戏页](design/surfaces/cloud.md)——证据等级：实测
- [游戏界面](design/surfaces/game-ui.md)——证据等级：社区
- [宣传物料](design/surfaces/promotional.md)——证据等级：观察 + 社区

### 组件

落到具体控件。

- [组件规范总览](design/components/README.md)——通用约定、清单与实现顺序
- [按钮](design/components/button.md)
- [导航](design/components/navigation.md)
- [卡片](design/components/card.md)
- [表单](design/components/form.md)
- [反馈](design/components/feedback.md)
- [浮层](design/components/overlay.md)
- [数据展示](design/components/data-display.md)

### Game 实机风格

照游戏内界面复刻的一组控件：独立入口，带官方图片，和上面的规范是两套东西。

- [总览、风险与处理](design/game/README.md)——和主库的区别、怎么引入、带了哪些官方图片、风险和我们的处理
- [动画弹窗与圆角下拉](design/game/dialog-and-select.md)
- [圆角控件](design/game/rounded-controls.md)——按钮、图标按钮、分段选择、文字开关
- [确认提示](design/game/confirmation-alerts.md)——紧凑卡片与通栏面板
- [物品卡片](design/game/item-cards.md)——稀有度、亮暗背景、库存和分层图标
- [物品悬浮卡](design/game/item-hover-cards.md)——详情、获取途径与网格悬浮预览
- [官网开屏页](design/game/splash-screen.md)——主入口的开屏页填上官方的标志、底图和微标

### 依据

- [官网实测数据](design/references/measurements.md)——官网首页的全部原始数值
- [云游戏页实测数据](design/references/measurements-cloud.md)——云游戏页（/cloud）和页面里的鹰角账号弹窗的原始数值
- [官方来源索引](design/references/official-sources.md)——来源等级的定义、官方渠道入口
- [开源项目调研](design/references/open-source-projects.md)——GitHub 上的相关项目与可借鉴之处

## 图解

`design/assets/` 下是本仓库原创的 SVG 图解，按主题分目录：

| 目录 | 内容 |
| --- | --- |
| `palette/` | 中性阶、信号黄与角色色、亮暗表面 |
| `typography/` | 字体角色、字阶 |
| `elements/` | 形状语义、切角、括号、斜纹、分节标题与分节标签组、镂空字、底纹、测绘叠层、图标网格、云游戏页的几样母题 |
| `layout/` | 官网桌面 / 移动线框、云游戏页首页与"更多"线框、偏心构图、游戏界面分区与家族、版本日历结构、图像处理 |
| `components/` | 按钮、导航、标签、卡片、表单、反馈、浮层、数据展示 |
| `motion/` | 时长与悬停分镜、闪烁曲线与加载阶段 |

这些图用来说明结构与比例，不是官方画面的复刻；图中的字体是系统回退字体。

## 约定

### 来源等级

| 等级 | 含义 |
| --- | --- |
| 实测 | 从官网样式中直接读到的数值 |
| 观察 | 在官方公开页面上看到的现象 |
| 社区 | 开源项目作者的取值或观察，本仓库未独立验证 |
| 推断 | 本文档自己的设计建议 |

### 更新文档

- 官网改版后，重新测量并更新 [measurements.md](design/references/measurements.md) 的日期与数值，再检查引用它的文档。云游戏页是另一套构建，改版节奏不同，复测记在 [measurements-cloud.md](design/references/measurements-cloud.md)。
- 改动任何令牌值时，同步修改 [theme.css](../packages/ui/src/styles/theme.css) 与对应文档里的表格。`pnpm check:docs` 会核对两边对不对得上，连同链接、锚点和图；文档站构建之前也会跑它。
- 组件的实现取值与规范不一致时（多半是为了适配暗色主题），把取值和理由写回对应的组件文档。
- 把"社区"级别的结论升级为"观察"时，注明游戏版本与观察日期。
- 新增图解只放原创 SVG。不提交官方截图、立绘、Logo 与字体。唯一的例外是 [Game 实机风格](design/game/README.md)：它用到的官方图片只许放在 `packages/ui/src/game` 下，并且逐张登记在那里的 `resource-provenance.json` 里。
