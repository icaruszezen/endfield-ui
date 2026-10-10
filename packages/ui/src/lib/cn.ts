import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * theme.css 里的自定义令牌名需要登记，否则 tailwind-merge 会把 `text-micro`
 * 当成颜色，与 `text-ink` 互相覆盖。改动 theme.css 的令牌名时同步改这里。
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["micro", "ghost"],
      tracking: ["ghost", "label"],
      shadow: ["rail"],
      ease: ["standard", "emphasis", "exit"],
      animate: [
        "flicker",
        "fill",
        "scroll-hint",
        "breathe",
        "marquee",
        "spin-slow",
        "blink",
        "slide-in",
        "turn-in",
        "fade-in",
        "indeterminate",
        "bracket-in",
        "shift-in",
        "wipe-in",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
