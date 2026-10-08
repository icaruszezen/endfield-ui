import type { RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * 弹窗与抽屉打开时焦点落在哪：内容区里第一个能聚焦的元素——表单的第一个字段，
 * 或者行动区的第一个按钮（约定是"取消"，破坏性确认因此不会一回车就执行）。
 * 内容区里没有时返回 `true`，交还给默认行为（标题带里的关闭按钮）。
 */
export function firstFocusableIn(content: RefObject<HTMLElement | null>) {
  return () => content.current?.querySelector<HTMLElement>(FOCUSABLE) ?? true;
}
