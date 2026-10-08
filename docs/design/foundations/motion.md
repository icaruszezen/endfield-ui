# 动效

## 定位与原则

1. **短。** 交互反馈在 0.2 – 0.3 秒内完成。
2. **硬。** 用位移、擦入、形变和明暗反转；不用弹跳、不用回弹、不用持续漂浮。
3. **有因果。** 动效解释"什么变了、从哪来"：底块从左滑入、文字让位给箭头、遮罩向一侧退出。
4. **戏剧性留给入场。** 闪烁点亮、加载页这类效果只在进入时出现一次，日常交互保持安静。
5. **可以关。** 尊重"减少动态效果"的系统设置。

## 时长与缓动

![时长令牌与按钮悬停分镜](../assets/motion/timing.svg)

| 令牌 | 值 | 用途 | 官网出现次数 |
| --- | --- | --- | --- |
| `--duration-instant` | 50ms | 按下的即时反馈 | 1 |
| `--duration-fast` | 200ms | 颜色、透明度变化 | 63 |
| `--duration-base` | 300ms | 位移、展开、形变——**默认档** | 119 |
| `--duration-slow` | 400ms | 较大面积的移动 | 8 |
| `--duration-slower` | 600ms | 入场 | 6（0.5s 与 0.6s 合计） |

官网的过渡九成集中在 0.2s 和 0.3s 两档（实测）。超过 0.6s 的只有个别的入场与循环动画。

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `ease-standard` | `ease` | 默认。官网多数过渡没有显式声明缓动，用的就是浏览器默认值 |
| `ease-emphasis` | `ease-in-out` | 往返的位移、面板展开 |
| `ease-exit` | `ease-out` | 入场、从屏幕外进入 |
| `ease-linear` | `linear` | 旋转、跑马灯、闪烁（Tailwind 内置，不在 `theme.css` 里） |

官网**没有使用任何自定义贝塞尔曲线**（实测）。不要引入带过冲的缓动（如 `cubic-bezier(0.34, 1.56, 0.64, 1)`），它会让界面显得"弹"。

在 Tailwind 里：

```html
<button class="transition-colors duration-(--duration-fast) ease-standard">…</button>
<div class="transition-transform duration-(--duration-base) ease-emphasis">…</div>
```

## 交互反馈的套路

以下都来自官网实测。

### 悬停：换色，不上浮

| 控件 | 悬停时 |
| --- | --- |
| 深色按钮 | 底 `#383838` → `#484848`，字 `#EEEEEE` → 白 |
| 浅色按钮 | 底白 → `#F0F0F0` |
| 分页方钮 | 底 `#FAFAFA` → 信号黄 |
| 导航图标 | `#D9D9D9` → `#858585` |
| 页签 | 底透明 → `#F3F3F3` |
| 主行动块（黑） | 黄色底层淡入，文字由白变墨 |
| 分享按钮 | 底变墨黑，图标变黄 |

没有任何控件在悬停时放大、上浮或加重阴影。

### 悬停：竖条变箭头

深色按钮左侧的黄色竖条，在悬停时变成一个向右的三角并右移——"这里可以前往"的暗示。做法是让同一个伪元素的 `clip-path` 在两个多边形之间过渡：

```css
.btn::after {
  content: "";
  position: absolute;
  left: 1rem;
  top: 22.5%;
  width: 0.75rem;
  height: 55%;
  background: var(--color-action);
  clip-path: polygon(0 0, 25% 0, 25% 100%, 0 100%);
  transition:
    clip-path var(--duration-base) var(--ease-standard),
    transform var(--duration-base) var(--ease-standard);
}

@media (hover: hover) {
  .btn:hover::after {
    clip-path: polygon(0 20%, 100% 50%, 0 80%, 0 80%);
    transform: translateX(0.625rem);
  }
}
```

两个 `polygon` 的顶点数必须相同才能插值，所以三角形写成四个点（最后两个重合）。

组件库把这两个形状做成了工具类 `marker-bar` 与 `marker-arrow`（见 [utilities.css](../../../packages/ui/src/styles/utilities.css)），写法是 `marker-bar group-hover:marker-arrow`。竖条的宽度用 `--marker-bar` 调，默认 3px。

### 激活：让位

页签被选中时，文字向左平移一小段，右侧淡入一个箭头块。导航轨的项在悬停时，一块灰色底向右展开，文字随之出现。共同点是：**新元素出现时，旧元素挪开一点给它腾位置**，而不是凭空叠上去。

### 入场：滑块揭示

分节标题进入视口时，一个灰色块从左侧滑入（`translateX(-100%)` → `0`），块内的箭头从 −45° 转正，随后标题文字淡入。顺序是"块 → 箭头 → 字"，每步错开约 0.1 秒（错开量为推断）。

对应三个工具类：`animate-slide-in`、`animate-turn-in`、`animate-fade-in`，各 300ms、`ease-out`，错开量用 `[animation-delay:100ms]` 这样的写法加。

### 关闭：转 90°

弹窗的关闭图标在悬停时旋转 90°。这是全站少有的旋转动效。

### 按下

按下态只换更深一档的颜色（黄 → `#EEEA00`，深灰 → `#282828`），不缩小。

## 标志性动画

![闪烁点亮的时间曲线与加载页的三个阶段](../assets/motion/flicker-and-loading.svg)

| 工具类 | 内容 | 用途 | 来源 |
| --- | --- | --- | --- |
| `animate-flicker` | 三次短闪后点亮，600ms | 大图、媒体、标题块入场 | 关键帧节奏：实测；时长：推断 |
| `animate-fill` | `scaleX(0)` → `scaleX(1)`，600ms | 进度条、色块充填（需设 `transform-origin: left`） | 实测 |
| `animate-scroll-hint` | 下坠 1.5rem 并淡出，循环 | 滚动提示 | 实测 |
| `animate-breathe` | 缩放 1 → 1.2 → 1，循环 | 提示点、等待态 | 实测 |
| `animate-marquee` | 平移 −50% 后停顿，循环 | 巨字跑马灯、过长的单行文字 | 实测 |
| `animate-spin` | 匀速旋转 | 加载指示、刻度圆环 | 实测 |
| `animate-blink` | 硬切的明灭 | 输入光标、录制指示 | 观察 |
| `animate-slide-in` | `translateX(-100%)` → `0`，300ms | 分节标题的滑块（外层要 `overflow: hidden`） | 实测；时长为推断 |
| `animate-turn-in` | `rotate(-45deg)` → `0`，300ms | 滑块里的斜箭头 | 实测；时长为推断 |
| `animate-fade-in` | 不透明度 0 → 1，300ms | 分节标题的文字 | 实测；时长为推断 |
| `animate-indeterminate` | 平移自身宽度的 150% 再返回，匀速，1.2s 一程，循环 | 不确定进度的色块（色块宽为轨道的 40%） | 推断 |
| `animate-pulse` | 不透明度 1 → 0.6 → 1，2s，循环 | 骨架的明度往返 | 推断 |

### 闪烁点亮

不透明度的时间线是 0 → 0.5 → 0 → 0.5 → 0 → 0.5 → 0 → 1，三次闪烁分别落在 10%、20%、40%。前两次挨得近、第三次隔得远，模拟设备通电时的不稳定。

- 只用于入场，播放一次。
- 同一视口同时只让一个元素闪烁。
- 不要用在文字段落和可交互控件上。

### 跑马灯

内容复制一份首尾相接，匀速移动到 −50% 后**停顿一下**再循环（关键帧在 80% 到位，80% – 100% 静止）。这个停顿让它看起来像机械装置，而不是无休止的滚动。

已实现为 `<Marquee duration gap pauseOnHover paused overflowOnly>`：

- 复制那一份由组件来做，副本对读屏隐藏、不可聚焦；两份之间的间隔用 `gap` 调，默认 2rem。
- 一程默认 20 秒，用 `duration` 调：内容越长给得越大，速度才不会变快。
- **要能停下来。** 鼠标悬停或焦点落到里面时暂停（默认开）；键盘和触屏用户靠 `paused`——在旁边放一个"暂停滚动"的按钮。
- `overflowOnly`：内容放得下就是一行普通的文字，放不下才动起来，容器宽度变了会重新判断。用在"可能过长的单行文字"上。
- 系统开启"减少动态效果"时不动、不显示副本，内容静止在起点，放不下的部分被裁掉。

### 加载页

近黑底（`#141414`）、左缘或底部的黄色进度条、大号等宽百分比、一行小字标语。百分比的数字与 `%` 用两种字号。

完整流程是三个阶段：**充填**（进度条从左充填，数字跳动）→ **就绪**（充满后停留片刻）→ **揭示**（遮罩向一侧滑出）。前两步的元素来自官网实测，第三步的滑出方向参考了社区项目。

加载期间锁定输入；内容就绪后不要为了播完动画而拖延。

组件里"揭示"是整块遮罩向上滑出，600ms（`--duration-slower`）、`ease-emphasis`；"就绪"没有内置的停留。详见 [反馈](../components/feedback.md) 的"加载"。

## 滚动

- 官网是整屏切换的长滚动，每个版块进入时触发各自的入场动画。
- 组件库不提供滚动劫持。入场动画用 `IntersectionObserver` 触发，播放一次，不随滚动反复重播。
- 不做视差。巨字可以用跑马灯横向移动，但不跟滚动联动。

## 减少动态效果

[theme.css](../../../packages/ui/src/styles/theme.css) 末尾已包含全局降级：系统开启"减少动态效果"时，所有动画与过渡的时长压到接近 0，循环动画只播一次。

写组件时仍要自查：

- 降级后内容必须**停在终态**（`animation-fill-mode: both`），不能停在透明或屏幕外。
- 状态变化不能只靠动效表达：页签选中除了位移还有底色变化。
- 跑马灯降级后要保证文字可读（静止在起点，溢出部分可省略）。

## 宜 / 忌

**宜**

- 默认用 `duration-base` + `ease-standard`，不确定时不要调。
- 用 `transform` 和 `opacity` 做动画。
- 让新元素的出现伴随旧元素的让位。
- 给 `:hover` 套 `@media (hover: hover)`，避免触屏上粘住悬停态。Tailwind v4 的 `hover:` 变体默认就是这样，组件里直接用它。

**忌**

- 弹跳、回弹、果冻式的缓动。
- 悬停时放大卡片、上浮加阴影。
- 元素持续漂浮、呼吸、发光（提示点除外）。
- 每张卡片都带入场动画，或每次滚动都重播。
- 用动效拖延用户：超过 0.6 秒的过渡要有充分理由。

## 来源

- 时长统计、关键帧、各控件的悬停变化：[measurements.md](../references/measurements.md) 第 7、8 节。
- 加载的三阶段流程：[LaoBiDeng321/Endfield-Style-Skill](https://github.com/LaoBiDeng321/Endfield-Style-Skill)。
- 令牌定义：[theme.css](../../../packages/ui/src/styles/theme.css)。
