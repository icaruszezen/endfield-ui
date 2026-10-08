/**
 * 装饰层共用的类：不挡操作、不可选中；高对比模式与打印时整个去掉。
 * 用它的元素同时要加 `aria-hidden="true"`。
 */
export const decor =
  "pointer-events-none select-none forced-colors:hidden print:hidden";
