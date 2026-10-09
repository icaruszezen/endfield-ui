import { menuPanel } from "../dropdown-menu/menu-style";

/**
 * 气泡卡片与悬浮卡共用的面板：下拉菜单的那一块，只把上下 4px 的内边距换成四周 16px。
 * 宽度跟着内容走，最宽 320px，也不超过视口里剩下的地方。
 * 要经过 `cn()`：后面的 `p-4` 要盖掉菜单面板自带的上下内边距
 */
export const popoverPanel = [
  menuPanel,
  "flex w-max max-w-[min(20rem,var(--available-width))] flex-col gap-3 p-4 text-sm wrap-anywhere",
];

/** 面板里的标题和它下面的一行说明 */
export const popoverTitle = "text-base font-bold";
export const popoverDescription = "text-ink-secondary";
