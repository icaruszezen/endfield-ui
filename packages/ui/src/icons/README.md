# icons

原创图标组件。目前只有控件自己用到的十八个：

| 图标 | 用在哪 |
| --- | --- |
| `ArrowCorner`（斜箭头 ↘）、`ArrowLeft`、`ArrowRight` | 分节标题、文字按钮 |
| `ChevronLeft`、`ChevronRight`、`ChevronDown` | 返回按钮、翻页、滚动提示 |
| `TriangleRight`（实心三角 ▶） | 页签的箭头块 |
| `Close`、`Plus`、`Minus`、`Check` | 关闭、增减、已选与半选 |
| `StatusInfo`、`StatusSuccess`、`StatusWarning`、`StatusDanger` | 提示条的四种色调、输入框的错误图标 |
| `Lock`、`Crosshair`（四个取景角加准星） | 物品格的"锁定"与"未获得" |
| `Menu`（三条横线） | 顶栏的菜单钮 |

四个状态图标的外形各不相同——方框、圆、三角、菱形——状态因此不只靠颜色区分。

## 规则

- **只收录原创图标。** 不收录、不描摹官方图标与 Logo，包括游戏内图标、官网导航图标和阵营徽记。
- 绘制规范见 [图标规范](../../../../docs/design/foundations/iconography.md)：24 网格、2px 描边、平头端点、尖角拐角、几何母题（菱形、三角、斜杠）。
- 每个图标一个文件，用 [`createIcon`](createIcon.tsx) 生成：接受 `size` 与 `className`，颜色用 `currentColor`，默认 `aria-hidden`。

```tsx
import { createIcon } from "./createIcon";

export const Plus = createIcon("Plus", <path d="M12 4v16M4 12h16" />);
```

- 通用图标（关闭、箭头、搜索等）优先画一套自己的；需要大量通用图标时，可以在文档站里搭配成熟的开源图标库，但不要打包进本库。
