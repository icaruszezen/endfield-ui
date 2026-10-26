# 斜纹与色条

三种"条"：铺在表面上的 **45° 斜纹**、表示危险的**警示条纹**、来自印刷校准的**注册色条**。后面另记一种云游戏页上的条码纹。

![斜纹与警示条纹](../assets/elements/hatching-stripes.svg)

## 斜纹

官网首页用得最多的纹理（实测）。统一的画法：6px 方格、−45°、每格两条斜带。

| 档 | 单条占比 | 颜色 | 用在哪 |
| --- | --- | --- | --- |
| 细 | 约 9% | 黑，整体 60% 不透明 | 以文字形状裁切，做镂空巨字 |
| 中 | 约 18% | 比底色亮一档（`#424242` 压 `#383838`） | 深色按钮的底纹（官网的返回按钮） |
| 粗 | 约 22% | 墨色（`ink`），5% 不透明 | 跟随主题的条带：分页条、弹窗标题栏 |

三档的区别只是斜带的宽度和颜色，方格大小与角度不变。

### 实现

```css
@utility hatch {
  background-image: repeating-linear-gradient(
    -45deg,
    var(--hatch-color, color-mix(in srgb, var(--ef-ink) 5%, transparent)) 0
      var(--hatch-width, 1.9px),
    transparent 0 calc(var(--hatch-size) * 0.7071)
  );
}
```

`--hatch-size` 是方格边长（令牌值 6px）；45° 斜纹的重复周期是边长的 0.7071 倍。默认值是"粗"档。

"粗"档实测是黑 5%（官网只有浅色的条带）。实现里换成了墨色的 5%：亮色下 `ink` 是 `#191919`，和黑 5% 看不出差别；暗色下 `ink` 是近白，斜带变成比底色亮一档的浅带，条带放进暗色主题不用另写一套。三档对应的 `--hatch-width`（斜带的垂直厚度）：

| 档 | `--hatch-width` | `--hatch-color` |
| --- | --- | --- |
| 细 | 0.75px | 墨色 60%：`color-mix(in srgb, var(--ef-ink) 60%, transparent)` |
| 中 | 1.5px | `var(--color-neutral-700)` 或比底色亮一档的值 |
| 粗 | 1.9px | `color-mix(in srgb, var(--ef-ink) 5%, transparent)` |

"中""细"两档各有一个修饰类，和 `hatch` 一起写：`hatch hatch-mid`、`hatch hatch-fine`。"细"档实测是黑 60%，实现里同样换成了墨色，暗色下是近白的细线。

```html
<!-- 分页条 -->
<div class="hatch bg-surface-muted">…</div>

<!-- 深色按钮底纹 -->
<button class="hatch bg-control [--hatch-color:#424242] [--hatch-width:1.5px]">返回</button>
```

斜纹非常细，在 1 倍屏上可能出现摩尔纹或亮度不均。如果效果不稳定，改用一张 6 × 6 的 SVG 平铺。

### 什么时候用

- 给**条带状**的表面一点质感：工具条、分页条、标题栏。
- 区分"可点的深色块"和"不可点的深色块"：官网的返回按钮带斜纹，普通深色面板不带。
- 游戏内用斜纹填充未探索的地图区域、最高稀有度的卡面（社区）。

不要铺满整个页面背景，也不要压在正文下面。

不用 Tailwind 的项目用 `<Hatch density>`：一块纯装饰的斜纹，`density` 取 `bold`（默认）、`mid`、`fine`，尺寸、位置、底色由 `className` 给。

云游戏页看得到的斜纹都画在图里，周期也各不相同——观察（云游戏页）。"更多"里每节顶上一根黄色斜纹长条：深 `#FDFD1F`、浅 `#FEFE63` 相间，二倍图里水平周期约 141px（约 70 设计 px），左端一小块灰，尾端渐隐到透明，排在一根 [刻度尺](hud-overlays.md#刻度尺) 下方；标题卡的上下两段是 `#D9D9D9` / `#DDDDDD` 的灰斜纹，镶在中间的点阵面板外面。CSS 画的只量到一处：游戏里悬浮球的菜单条，底是 −45° 的深灰细斜纹（`repeating-linear-gradient`，周期 4px）——实测（云游戏页），只读了规则。这里取了原来的画法：6px 方格、−45°，只用在条带和控件上。那根黄斜纹是黄配浅黄，不是警示条纹。见 [云游戏页](../surfaces/cloud.md#更多)。

## 警示条纹

黄黑相间的 45° 宽条，每条约 12px。

官网上没有量到它；它出自社区项目对游戏界面与工业主题的归纳，等级是**社区**。

```css
@utility hazard {
  background-image: repeating-linear-gradient(
    -45deg,
    var(--color-signal) 0 var(--hazard-size, 12px),
    var(--color-neutral-900) var(--hazard-size, 12px)
      calc(var(--hazard-size, 12px) * 2)
  );
}
```

已经在 [utilities.css](../../../packages/ui/src/styles/utilities.css) 里，另有组件 `<HazardStripe size>`：通宽的窄条，`sm` 高 6px、`md` 高 12px。

- 黄与黑两个主题下相同。暗色页面上黑色那一半会融进背景，看到的是一排黄色的斜块——仍然读得出是警示条纹。
- 它只是装饰，对读屏隐藏，高对比模式下不显示：危险的含义必须另外用文字写出来。

规则：

- 只做**窄条**，高 6 – 12px：分隔线、页脚顶边、危险操作区的边缘。
- 一个视口最多一处。
- 它和红色一样带"危险 / 施工"含义。删除确认、不可逆操作的区域可以用；普通内容不要用。
- 不要做成按钮背景或卡片描边。

## 注册色条

印刷品边缘用来校准套色的小色块。官网首页把它做成一条很短的品红 – 青 – 黄三色微条，放在分节标签旁边和名称下方（观察）。

![分节标签组的构成](../assets/elements/label-cluster.svg)

| 项 | 规范 | 来源 |
| --- | --- | --- |
| 颜色 | 品红、青、黄，通常再配一段灰 | 观察 |
| 取值 | `reg-magenta` `#EC008C`、`reg-cyan` `#00AEEF`、`reg-yellow` `#FFF200` | 推断（印刷三原色的常用屏幕近似值；官网首页的色条是图片，没有可读的值） |
| 形态 | 竖条：每段约 6 × 14px 叠放；横条：高 3px，每段等长 | 观察 |
| 位置 | 分节标签组的末尾、名称下方的分隔线 | 观察 |

```html
<!-- 横向：名称下方的分隔线 -->
<div aria-hidden="true" class="flex h-[3px]">
  <span class="w-16 bg-reg-magenta"></span>
  <span class="w-16 bg-reg-cyan"></span>
  <span class="w-16 bg-reg-yellow"></span>
  <span class="flex-1 bg-line"></span>
</div>
```

已实现为 `<RegistrationStrip orientation rule>`：

- 横条高 3px、每段 64px；竖条是三段 6 × 14px 叠放；
- `rule` 在横条后面接一段 `line` 色的灰线并撑满容器，就是上面"名称下方的分隔线"；
- 三个颜色两个主题下相同。

规则：

- **纯装饰**，不承担任何数据或状态含义。
- **不要和图表配色混用。** 页面里有图表时，注册色条离图表远一点，或者不用。
- 一个版块最多一处。它是"印刷品"语气的点缀，不是每个标题的标配。
- 这三个颜色不要用在别处：不做按钮色、不做标签色。

云游戏页给出了第一组读得到的值——实测（云游戏页）：分享浮层头部左缘一根 2 × 34px 的竖条，CSS 渐变硬分段，从上到下品红 `#FE1AAB` 7px、薄荷绿 `#3BFFB7` 8px、黄 `#FEFB3C` 19px。下载卡片左上缘那根画在卡片背景图里：`#FF1AAC`、`#00FFA2`、`#FFFA00` 三段等长，黄段往下渐隐到白；时长记录弹窗头图的下沿还有一根横条，绿、品牌黄、品红约 6 : 3 : 1——这两处是观察（云游戏页）。三处的绿都是薄荷绿，不是印刷的青；分享浮层和时长记录那两根也不是等长分段。这里取了原来的三个值，三个都仍是推断。见 [云游戏页](../surfaces/cloud.md#几样母题)。

## 条码纹

一组并排的灰色细竖条，像一段条形码。云游戏页有两处，都画在图里——观察（云游戏页）：

- 下载弹窗的深色头带上，标题左边一组，旁边一个灰色的平行四边形和两条往右延伸的横线；
- "更多"里频率条的端头，一块灰色的微缩字和条码块，右缘一根黄竖条。

库里没有对应的组件。要用就当成注册色条那样的点缀：纯装饰，不承担含义，对读屏隐藏。见 [云游戏页](../surfaces/cloud.md#下载弹窗)。

## 宜 / 忌

**宜**

- 全站的斜纹用同一个方格大小和角度。
- 把斜纹限制在条带和控件上。
- 把注册色条当成签名：小、少、固定位置。

**忌**

- 斜纹的方向一会儿左倾一会儿右倾。
- 用警示条纹装饰普通内容。
- 把注册色条放大成彩虹色的页眉。
- 在同一个视口里同时用斜纹、警示条纹和注册色条。

## 来源

- 斜纹的参数：[measurements.md](../references/measurements.md) 第 6 节。
- 警示条纹：[LaoBiDeng321/Endfield-Style-Skill](https://github.com/LaoBiDeng321/Endfield-Style-Skill)。
- 注册色条不作通用页眉、不与数据色混用：[Statrue/endfield-design-skill](https://github.com/Statrue/endfield-design-skill)。
- 云游戏页的斜纹、三色竖条、条码纹：[measurements-cloud.md](../references/measurements-cloud.md) 第 3.4、6、8.9、8.10、8.11、9.3、9.5 节；[云游戏页](../surfaces/cloud.md#几样母题)。
- 相关规范：[纹理与装饰](../foundations/texture.md)。
