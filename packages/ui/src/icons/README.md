# icons

原创图标组件。目前只有基础控件自己用到的八个：

`ArrowCorner`（斜箭头 ↘）、`ArrowLeft`、`ArrowRight`、`ChevronLeft`、`ChevronRight`、`TriangleRight`（实心三角 ▶）、`Close`、`Plus`。

## 规则

- **只收录原创图标。** 不收录、不描摹官方图标与 Logo，包括游戏内图标、官网导航图标和阵营徽记。
- 绘制规范见 [图标规范](../../../../docs/design/foundations/iconography.md)：24 网格、2px 描边、平头端点、尖角拐角、几何母题（菱形、三角、斜杠）。
- 每个图标一个文件，用 [`createIcon`](createIcon.tsx) 生成：接受 `size` 与 `className`，颜色用 `currentColor`，默认 `aria-hidden`。

```tsx
import { createIcon } from "./createIcon";

export const Plus = createIcon("Plus", <path d="M12 4v16M4 12h16" />);
```

- 通用图标（关闭、箭头、搜索等）优先画一套自己的；需要大量通用图标时，可以在文档站里搭配成熟的开源图标库，但不要打包进本库。
