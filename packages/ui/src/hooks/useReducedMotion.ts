import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(notify: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function read() {
  return (
    typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches
  );
}

/**
 * 系统开了"减少动态效果"时返回 true，设置变了会跟着变。
 *
 * CSS 的动画和过渡不用它：`theme.css` 末尾的全局规则已经统一降级了。
 * 只有脚本驱动的动效（一帧一帧自己算的）才要看它——那条规则管不到脚本。
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
