# styles

| 文件 | 内容 |
| --- | --- |
| [theme.css](theme.css) | 设计令牌：语义变量（亮 / 暗）+ Tailwind v4 `@theme` 映射 |
| [utilities.css](utilities.css) | `@utility`：母题工具类（斜纹、切角、斜楔、角括号、镂空字、警示条纹、竖条变箭头），以及菱形表单符号的开关 |
| [index.css](index.css) | 入口：`tailwindcss` → `theme.css` → `utilities.css` → 基础样式 → `@source` |

对外的三个入口（见包的 `exports`）：

| 引入路径 | 对应 | 给谁用 |
| --- | --- | --- |
| `@endfield-ui/react/tailwind.css` | `index.css` | 用 Tailwind v4 的项目，代替 `@import "tailwindcss"` |
| `@endfield-ui/react/styles.css` | `dist/styles.css` | 不用 Tailwind 的项目，预编译产物 |
| `@endfield-ui/react/theme.css` | `theme.css` | 只要令牌、不要组件 |

## theme.css 的结构

1. **语义变量**：亮色定义在 `:root` 与 `[data-theme="light"]`（对齐官网的纸白基底），`[data-theme="dark"]` 覆盖为暗色（对齐游戏 HUD 与官网深色版块）。两种取值都可以加在局部容器上。
2. **`@theme`**：不随主题变化的原始令牌——色板、字体、字阶、圆角、阴影、缓动、动画、切角尺寸（`--cut-sm` / `md` / `lg`），以及层叠值（目前只有加载页的 `--z-loader`，用法是 `z-(--z-loader)`）。
3. **`@theme inline`**：把第 1 步的语义变量映射成 Tailwind 颜色，生成 `bg-surface`、`text-ink`、`border-line` 这类工具类。

## 只用令牌

```css
@import "tailwindcss";
@import "@endfield-ui/react/theme.css";
```

```html
<html data-theme="dark">
  <button class="bg-action text-on-action font-sans text-lg">前往游戏</button>
</html>
```

## 修改令牌

令牌值的依据写在 [docs/design/foundations](../../../../docs/design/foundations/color.md)。改动任何一个值时，同步改对应文档里的表格；文档里每个值都标了来源等级（实测 / 观察 / 社区 / 推断），替换"社区"和"推断"级别的值时请在文档里写明新的依据。

新增或改名自定义的字阶、阴影、缓动、动画、字距令牌时，还要同步 [lib/cn.ts](../lib/cn.ts) 里登记给 `tailwind-merge` 的清单，否则 `cn()` 会把它们归错类。

## 母题工具类

| 工具类 | 作用 | 可调的变量 |
| --- | --- | --- |
| `hatch`，加 `hatch-mid` / `hatch-fine` | 45° 斜纹的粗、中、细三档 | `--hatch-color`、`--hatch-width` |
| `hazard` | 黄黑警示条纹 | `--hazard-size` |
| `cut-tr`、`cut-br`、`cut-diagonal`，加 `cut-sm` / `cut-md` / `cut-lg` | 切角与切口大小 | `--cut` |
| `wedge`、`wedge-l`、`wedge-r` | 两侧 / 单侧斜切 | `--wedge` |
| `corner-brackets` | 四角的 L 形短线，画在 `::after` 上 | `--bracket-color`、`--bracket-arm`、`--bracket-width`、`--bracket-offset` |
| `ghost-hatch`、`ghost-outline` | 镂空字的斜纹与描边两种画法 | `--ghost-ink` |
| `dot-grid` | 点阵底纹 | `--dot-color`、`--dot-size`、`--dot-gap` |
| `blueprint-grid` | 工程网格底纹 | `--grid-color`、`--grid-gap` |
| `contour` | 等高线底纹，贴在右下角、朝左上淡出 | `--contour-color`、`--contour-size`、`--contour-position`、`--contour-image` |
| `marker-bar`、`marker-arrow` | 按钮里竖条变箭头的两个形状 | `--marker-bar` |

- 跟着主题走的颜色（斜纹、角括号、镂空字、三种底纹）默认取 `--ef-ink`；警示条纹和斜纹的"中"档有意不随主题变。
- `cut-*` 与 `wedge*` 用的是 `clip-path`，会把焦点环一起裁掉。可聚焦的元素把它们写在伪元素上：`before:cut-tr before:bg-action`。
- `corner-brackets` 不替宿主设 `position`，宿主自己要是 `relative` 或 `absolute`。
- `contour` 是遮罩（`mask-image`），会把元素自己的内容一起遮掉：只能写在空的装饰层上。`dot-grid` 和 `blueprint-grid` 是背景，没有这个限制，但同样建议画在独立的装饰层上。
- 镂空字不叫 `text-hatch`：`text-*` 是字号和文字颜色的名字空间，`cn()` 合并类名时会把它当成颜色。

这些类只画形状。什么东西可以切角、哪里能放斜纹，见 [docs/design/elements](../../../../docs/design/elements/corner-and-wedge.md) 各篇的"什么时候用"。预编译的 `styles.css` 里只有组件自己用到的那几个；不用 Tailwind 的项目用对应的装饰组件。

文件末尾还有一个自定义变体 `choice-diamond:`，在祖先带 `data-choice="diamond"` 时生效，复选与单选靠它整体换成菱形符号。

## 注意

`index.css` 里的 `@source "../"` 扫的是整个 `src`，不能缩成只扫 `components`：焦点环这类共用的类名写在 `lib` 里，扫不到就不会生成。
