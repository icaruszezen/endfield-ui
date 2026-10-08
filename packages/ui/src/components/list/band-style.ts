/*
 * 行带：浅色画布上一条条固定深色的行。列表的 `band` 变体和数据行带共用。
 *
 * 行带自己是一个局部暗色主题——用 `bandRow` 的元素（或它的祖先）上要写
 * `data-theme="dark"`，行里的次要文字、焦点环才会按深色底取值。
 */

/** 画布：凹陷底，四周留 12px */
export const bandCanvas = "bg-surface-sunken p-3";

/** 行与行之间的缝 */
export const bandGap = "gap-1.5";

/**
 * 一条行带。带一圈 1px 的线：亮色页面上看不出来；
 * 暗色页面上画布是纯黑、行带是 #141414，靠它分开。
 */
export const bandRow = "border border-line bg-surface text-ink";
