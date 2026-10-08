# 开源项目调研

GitHub 上与终末地视觉风格相关的开源项目。数据取自 2026-10-08（星标数会变）。

本仓库对这些项目的用法是：**读它们的方法和结论，用自己的话写规范，注明出处；不复制代码、不拷贝素材。** 标注"无许可证"的项目默认保留所有权利，只能阅读。

## 设计方法与规范类

### [Statrue/endfield-design-skill](https://github.com/Statrue/endfield-design-skill)

MIT · 面向 Claude Code / Codex 的设计 Skill。

把终末地的视觉语言整理成"先定任务与界面家族，再选母题"的方法，而不是一张配色表。它的价值在于**反对把风格简化成黑黄皮肤**。

可借鉴：

- **十类界面家族**：HUD / 枢纽、地图、角色工作室、仓库 / 商城、技能树 / 流程、数据简报、通讯 / Wiki、官网、KV、编辑物料。本仓库的 [游戏界面](../surfaces/game-ui.md) 沿用了这个分法。
- **颜色角色表**：黄 = 行动与选中，橙 = 通知与数量，荧光黄绿 = 增益，蓝 = 量值图表，青 = 地区主题，红 = 危险，紫 = 特殊；稀有度色阶蓝 → 紫 → 金 → 橙。附有取色值。
- **形状语义**：切角 = 机械与权限，圆弧 = 技能与仪表，胶囊 = 对话与筛选。
- **母题分层**：稳定层 / 条件层 / 主题专用层，以及"每屏一到两种纹理"的预算。
- **证据登记**：每条规则对应到来源并标注可复核性。本仓库的来源等级受它启发。

注意：它的游戏界面观察基于维护者本地的实机截图，不随仓库分发，读者无法复核。本仓库引用这些结论时一律标"社区"。

### [ymh0000123/dsh-theme-endfield](https://github.com/ymh0000123/dsh-theme-endfield)

MIT · ★130 · 某 Web 应用的终末地官网风格主题插件。

`docs/design-language.md` 是目前写得最清楚的"官网风格"说明，核心概括是**工业编辑风：纸与墨是主体，强调色是信号**。

可借鉴：

- 亮色用带暖灰的纸色（`#E8E8E2`）而非纯白，暗色用带一点绿倾向的近黑（`#101110`）而非纯黑。
- **强调色在亮底上必须"下沉"**：`#FFF500` 的黄字压在纸底上只有约 1.07:1，所以亮色模式里"强调色作文字"的地方换成同色相的深档（`#6B5D00`）。
- 每个颜色角色对它实际落在的表面验算对比度，并写成测试。
- 第二套强调色"武陵青"（`#14D0D0`）的取值推导。

注意：它的中性色是作者的再设计，与官网实测的纯灰阶（`#FAFAFA`、`#F2F2F2`…）不同。

### [LaoBiDeng321/Endfield-Style-Skill](https://github.com/LaoBiDeng321/Endfield-Style-Skill)

MIT · 把任意网页改造成终末地官网风格的 Skill。

可借鉴：

- 一份紧凑的形态语言清单：全直角、等宽数字、72px 工程网格、L 形角标、描边序号大字、切角主按钮、黄黑警示条纹、HUD 读数。
- **开屏三阶段**：充填 → 右滑 → 渐显，带等宽百分比读数。
- 把"配色"与"形态"拆成两个独立维度，可以只套形态、保留原有品牌色。

注意：它的"全直角""禁止辉光"比官网实际更绝对，官网有圆形与胶囊，也有两处辉光。

### [Maimai-l/arknights-endfield-designsystem](https://github.com/Maimai-l/arknights-endfield-designsystem)

**无许可证** · 官网控件的提取包。

从官网提取了 30 个控件的 DOM 与样式，并附带官方字体、图标与纹理文件。

可借鉴：只借鉴它列出的**控件清单**——导航项、工具胶囊、分享按钮、行动按钮、分节标题、分页、圆钮、选择器、播放钮、日期标签、列表按钮、标签条、头像切换、卡片、标题块、媒体卡、关闭钮、弹窗框、轻提示、页签、返回钮、页头、下拉触发器、下载磁贴、镂空字、分隔带等。

注意：仓库内含官方素材且没有许可证。**不要下载、不要引用其中的任何文件。** 本仓库的同类数据是自己从官网量的，见 [measurements.md](measurements.md)。

## 组件库与主题实现类

### [VBeatDead/ReEnd-Components](https://github.com/VBeatDead/ReEnd-Components)

MIT · ★24 · React + Tailwind CSS v3 + Radix UI · [文档站](https://reend-components.pages.dev)

目前最完整的终末地风格 React 组件库，75+ 组件，暗色优先。和本仓库的目标最接近，是组件清单与工程结构的主要参照。

可借鉴：

- **组件清单**：表单、展示、导航、反馈、浮层五类通用组件，外加一组"Signature"组件（HUD 叠层、战术面板、任务卡、干员卡、扫描分隔线、坐标标签、菱形加载器、雷达图、故障文字等）。
- **菱形语法**：复选框选中 = ◆，单选 ◇ → ◆，开关的滑块是菱形，评分用菱形代替星形，时间线节点 ◆ / ◇。
- 令牌分层：原始色 → 语义色 → 表面层级（`surface-0` 到 `surface-3`）→ 层叠顺序 → 缓动与时长。
- shadcn 式的 CLI 分发（`add button` 把源码拷进项目）。

差异：

- 它的黄是偏金的 `#FFD429`，底是 `#0A0A0A`，整体是"暗色战术 HUD"取向；本仓库默认亮色，黄取官网实测的 `#FFFA00`。
- 它用 Tailwind v3 的预设 + HSL 变量；本仓库用 Tailwind v4 的 `@theme`。
- 它的字体（Bender、Orbitron）是作者选择，官网没有使用。

### [Talos-Pioneers/ui](https://github.com/Talos-Pioneers/ui)

AGPL-3.0 · Vue · 蓝图分享站 [talospioneers.com](https://talospioneers.com) 的组件库。

可借鉴：面向工具类站点的终末地风格落地方式。AGPL 许可，**只读不抄**。

### DSH 主题系列

[rison114514/dsh-endfield-ui](https://github.com/rison114514/dsh-endfield-ui)（★80）、[thjyy/dph-endfield-theme](https://github.com/thjyy/dph-endfield-theme)、[Longxiangjunlin/dsh-endfield-theme](https://github.com/Longxiangjunlin/dsh-endfield-theme)、[INnoVationEE/dsh-endfield-theme](https://github.com/INnoVationEE/dsh-endfield-theme)。

同一个宿主应用上的多套终末地主题。可以对比同一界面在"奶油纸 + 信号黄"与"炭黑 + 警示黄 HUD"两种取向下的效果。这四个仓库要么没有许可证，要么许可证无法被 GitHub 识别，只读不抄。

### 其他主题与站点

| 项目 | 许可 | 内容 |
| --- | --- | --- |
| [Yue-plus/astro-endfield](https://github.com/Yue-plus/astro-endfield) | MIT | Astro 站点主题，较早的终末地风格网页实现 |
| [ChuwuYo/Endfield-Pomodoro](https://github.com/ChuwuYo/Endfield-Pomodoro) | MIT | 番茄钟应用，可看风格在小型工具上的收敛程度 |
| [SylverQG/EndLike](https://github.com/SylverQG/EndLike) | 无 | 个人站点 |
| [misaka10843/endfield-style-error-page](https://github.com/misaka10843/endfield-style-error-page) | GPL-3.0 | 错误页 |
| [Phunzage/endfield-blog-ui](https://github.com/Phunzage/endfield-blog-ui) | 无 | 博客主页 |

## 素材与工具类

| 项目 | 许可 | 内容 | 备注 |
| --- | --- | --- | --- |
| [Yue-plus/endfield_icons](https://github.com/Yue-plus/endfield_icons) | MIT · ★92 | 终末地图标与 Logo 的矢量整理 | 仓库的 MIT 只覆盖作者的整理工作，图形本身的权利属于鹰角。本仓库不收录 |
| [NCreeper233/endfield-logo-maker](https://github.com/NCreeper233/endfield-logo-maker) | MIT | 终末地风格 Logo 生成器 | 可观察标志的字形结构与排版比例 |
| [Naptie/endfield-docmaker](https://github.com/Naptie/endfield-docmaker) | MPL-2.0 · ★130 | 生成世界观内各机构签发文档的工具 | 档案 / 公文类版式的参照 |
| [GlacierGlimmer/zmd-charge-plus](https://github.com/GlacierGlimmer/zmd-charge-plus) | MIT · ★139 | 终末地风格的系统状态 HUD | 小尺寸 HUD 元件的参照 |
| [Terra-Online/Atlos](https://github.com/Terra-Online/Atlos) | AGPL-3.0 · ★158 | 互动地图 | 地图类界面的参照，AGPL 只读 |
| [palmcivet/awesome-arknights-endfield](https://github.com/palmcivet/awesome-arknights-endfield) | MIT · ★110 | 终末地相关项目的 Awesome 列表 | 找更多项目的入口 |

## 各项目的取值对照

同一个角色，不同项目的取值差别很大，说明"终末地黄"并没有唯一答案：

| 角色 | 官网实测 | dsh-theme-endfield | Endfield-Style-Skill | ReEnd | endfield-design-skill |
| --- | --- | --- | --- | --- | --- |
| 主黄 | `#FFFA00` | `#FFF500` | `#FFF500` | `#FFD429` | 选中 `#FFFA00`，行动 `#F8D34D` |
| 暗底 | `#141414` / `#000` | `#101110` | `#101110` | `#0A0A0A` | `#1B1C1E` |
| 亮底 | `#FFFFFF` / `#FAFAFA` | `#E8E8E2` | — | — | `#F1F1EE` |
| 主文字（亮） | `#191919` | `#101110` | — | — | `#1C1C1C` |
| 默认圆角 | 0，另有小圆角与胶囊 | 0（可切换） | 0 | 0 / 2px / 4px | 按语义 |

本仓库的选择与理由见 [色彩](../foundations/color.md)。

## 从这些项目里学到的三件事

1. **官网和游戏是两种气质。** 官网是纸白底的"工业编辑风"，游戏内是亮暗并存、信息密度更高的操作界面。只做暗色 HUD 会丢掉一半。
2. **风格不等于黑黄。** 做得好的项目都在强调结构（偏心构图、边缘停靠、形状语义），而不是给每个组件加黄边和切角。
3. **素材边界要早定。** 带官方素材的仓库用起来方便，但没法干净地开源。本仓库从一开始就只放原创内容。
