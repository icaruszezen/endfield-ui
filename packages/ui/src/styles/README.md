# styles

| 文件 | 状态 | 内容 |
| --- | --- | --- |
| [theme.css](theme.css) | 草案 | 设计令牌：语义变量（亮 / 暗）+ Tailwind v4 `@theme` 映射 |
| `index.css` | 未建 | 入口：`@import "tailwindcss"` → `@import "./theme.css"` → 基础样式 |
| `utilities.css` | 未建 | `@utility`：切角、角括号、斜纹、镂空字等母题工具类 |
| `keyframes.css` | 未建 | 如果 `theme.css` 里的关键帧变多，再拆出来 |

## theme.css 的结构

1. **语义变量**：定义在 `:root`（亮色，对齐官网的纸白基底），`[data-theme="dark"]` 覆盖为暗色（对齐游戏 HUD 与官网深色版块）。
2. **`@theme`**：不随主题变化的原始令牌——色板、字体、字阶、圆角、阴影、缓动、动画。
3. **`@theme inline`**：把第 1 步的语义变量映射成 Tailwind 颜色，生成 `bg-surface`、`text-ink`、`border-line` 这类工具类。

## 用法（组件库初始化之后）

```css
@import "tailwindcss";
@import "./theme.css";
```

```html
<html data-theme="dark">
  <button class="bg-action text-on-action font-sans text-lg">前往游戏</button>
</html>
```

## 修改令牌

令牌值的依据写在 [docs/design/foundations](../../../../docs/design/foundations/color.md)。改动任何一个值时，同步改对应文档里的表格；文档里每个值都标了来源等级（实测 / 观察 / 社区 / 推断），替换"社区"和"推断"级别的值时请在文档里写明新的依据。

切角、角括号等 `@utility` 的参考写法目前只在 [docs/design/elements](../../../../docs/design/elements/corner-and-wedge.md) 里以代码片段形式给出，实现组件时再落到 `utilities.css`。
