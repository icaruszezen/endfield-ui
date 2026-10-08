import {
  useEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";

export type ItemGridProps = ComponentProps<"div">;

type SlotPosition = { top: number; left: number };

const CONTROL = "[data-slot-control]";
/** 禁用的按钮本来就聚焦不了；禁用的链接只是标了 `aria-disabled` */
const ENABLED = `${CONTROL}:not(:disabled):not([aria-disabled="true"])`;
const SELECTED = '[aria-pressed="true"], [aria-current]';

const KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

/** 同一行的格子顶边应该一样高，留 2px 给小数像素 */
const ROW_TOLERANCE = 2;

/**
 * 按下一个键之后该到哪一格。`positions` 是各格子的位置（文档顺序），返回目标的下标；
 * 不该动的时候（已经在边上、不认识的键）返回 `current`。
 *
 * - `←` `→` 在同一行里移动，到头不折行；
 * - `↑` `↓` 到上下一行里水平位置最近的那一格；
 * - `Home` / `End` 到行首行尾，带 `ctrl` 是第一格和最后一格。
 */
export function nextSlotIndex(
  positions: readonly SlotPosition[],
  current: number,
  key: string,
  ctrl = false,
): number {
  const here = positions[current];
  if (!here) return current;

  // 按顶边把格子分成行；行内按左边排，左边一样时按文档顺序
  const order = positions
    .map((_, index) => index)
    .sort(
      (a, b) =>
        positions[a]!.top - positions[b]!.top ||
        positions[a]!.left - positions[b]!.left ||
        a - b,
    );
  const rows: number[][] = [];
  for (const index of order) {
    const row = rows.at(-1);
    if (
      row &&
      positions[index]!.top - positions[row[0]!]!.top <= ROW_TOLERANCE
    ) {
      row.push(index);
    } else {
      rows.push([index]);
    }
  }
  for (const row of rows) {
    row.sort((a, b) => positions[a]!.left - positions[b]!.left || a - b);
  }

  const rowIndex = rows.findIndex((row) => row.includes(current));
  const row = rows[rowIndex]!;
  const column = row.indexOf(current);

  const nearestIn = (target: number[] | undefined) => {
    if (!target) return current;
    let best = target[0]!;
    for (const index of target) {
      if (
        Math.abs(positions[index]!.left - here.left) <
        Math.abs(positions[best]!.left - here.left)
      ) {
        best = index;
      }
    }
    return best;
  };

  switch (key) {
    case "ArrowRight":
      return row[column + 1] ?? current;
    case "ArrowLeft":
      return row[column - 1] ?? current;
    case "ArrowDown":
      return nearestIn(rows[rowIndex + 1]);
    case "ArrowUp":
      return nearestIn(rows[rowIndex - 1]);
    case "Home":
      return ctrl ? rows[0]![0]! : row[0]!;
    case "End":
      return ctrl ? rows.at(-1)!.at(-1)! : row.at(-1)!;
    default:
      return current;
  }
}

/**
 * 物品格的矩阵：一组 `ItemSlot` 排成自动填充的网格，整个矩阵只占一个 Tab 停靠点，
 * 进去之后用方向键在格子之间走。给它一个 `aria-label`，说明这是哪一组物品。
 *
 * 默认每格最小 72px、间距 8px，四周留 4px 给选中格的角括号；用 `className` 改。
 */
export function ItemGrid({
  className,
  onKeyDown,
  onFocus,
  ref: forwardedRef,
  ...props
}: ItemGridProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 漫游 tabindex：只有一格能被 Tab 停到。优先是上次聚焦的那一格，其次是选中的，再其次是第一格。
  // 直接写在 DOM 上——格子自己不管 tabindex，React 不会把它改回去
  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    const sync = () => {
      const enabled = [...grid.querySelectorAll<HTMLElement>(ENABLED)];
      const stop =
        enabled.find((control) => control === document.activeElement) ??
        enabled.find((control) => control.getAttribute("tabindex") === "0") ??
        enabled.find((control) => control.matches(SELECTED)) ??
        enabled[0];
      for (const control of grid.querySelectorAll<HTMLElement>(CONTROL)) {
        const next = control === stop ? "0" : "-1";
        if (control.getAttribute("tabindex") !== next) {
          control.setAttribute("tabindex", next);
        }
      }
    };

    sync();
    // 格子增减、禁用状态变化之后重新定一次；只盯这些，自己改 tabindex 不会再触发
    const observer = new MutationObserver(sync);
    observer.observe(grid, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled"],
    });
    return () => observer.disconnect();
  }, []);

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    const target = event.target as HTMLElement;
    if (!target.matches(CONTROL)) return;
    // 焦点到了哪一格（方向键走过去的，或者点的），停靠点就跟到哪一格
    for (const control of event.currentTarget.querySelectorAll(CONTROL)) {
      control.setAttribute("tabindex", control === target ? "0" : "-1");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !KEYS.has(event.key)) return;
    if (event.altKey || event.metaKey || event.shiftKey) return;
    const ctrl = event.ctrlKey;
    // Ctrl 只和 Home / End 配
    if (ctrl && event.key !== "Home" && event.key !== "End") return;

    const controls = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(ENABLED),
    ];
    const current = controls.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;

    // 网格是自动填充的，一行几格随宽度变：按格子此刻的实际位置算
    const positions = controls.map((control) => {
      const rect = control.getBoundingClientRect();
      return { top: rect.top, left: rect.left };
    });
    const next = nextSlotIndex(positions, current, event.key, ctrl);

    // 走到边上不动的时候也拦下来，免得页面跟着滚
    event.preventDefault();
    if (next !== current) controls[next]!.focus();
  };

  return (
    <div
      role="group"
      {...props}
      ref={mergeRefs(ref, forwardedRef)}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2 p-1",
        className,
      )}
    />
  );
}
