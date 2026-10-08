# styles

| 文件 | 内容 |
| --- | --- |
| [theme.css](theme.css) | 设计令牌：语义变量（亮 / 暗）+ Tailwind v4 `@theme` 映射 |
| [utilities.css](utilities.css) | `@utility`：已有组件用到的母题工具类（斜纹、竖条变箭头） |
| [index.css](index.css) | 入口：`tailwindcss` → `theme.css` → `utilities.css` → 基础样式 → `@source` |

对外的三个入口（见包的 `exports`）：

| 引入路径 | 对应 | 给谁用 |
| --- | --- | --- |
| `@endfield-ui/react/tailwind.css` | `index.css` | 用 Tailwind v4 的项目，代替 `@import "tailwindcss"` |
| `@endfield-ui/react/styles.css` | `dist/styles.css` | 不用 Tailwind 的项目，预编译产物 |
| `@endfield-ui/react/theme.css` | `theme.css` | 只要令牌、不要组件 |

## theme.css 的结构

1. **语义变量**：亮色定义在 `:root` 与 `[data-theme="light"]`（对齐官网的纸白基底），`[data-theme="dark"]` 覆盖为暗色（对齐游戏 HUD 与官网深色版块）。两种取值都可以加在局部容器上。
2. **`@theme`**：不随主题变化的原始令牌——色板、字体、字阶、圆角、阴影、缓动、动画。
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

`utilities.css` 只收录已有组件用到的母题。切角、角括号、镂空字等的参考写法仍在 [docs/design/elements](../../../../docs/design/elements/corner-and-wedge.md) 里以代码片段形式给出，用到时再落进来。

## 注意

`index.css` 里的 `@source "../"` 扫的是整个 `src`，不能缩成只扫 `components`：焦点环这类共用的类名写在 `lib` 里，扫不到就不会生成。
