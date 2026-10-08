import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type KbdSize = "sm" | "md";

export type KbdProps = ComponentProps<"kbd"> & {
  /** 20px 或 24px 高 */
  size?: KbdSize;
};

const sizeClass: Record<KbdSize, string> = {
  sm: "h-5 min-w-5 px-1 text-xs",
  md: "h-6 min-w-6 px-1.5 text-sm",
};

/**
 * 键位提示：一颗小键帽，贴在对应的控件旁。
 * 只用于真的支持键盘快捷键的地方，触屏界面和普通网页不要伪造键帽。
 * 组合键分开写：`<Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>`。
 */
export function Kbd({ size = "sm", className, ...props }: KbdProps) {
  return (
    <kbd
      {...props}
      className={cn(
        // 反转块：亮色下是墨色键帽，暗色下是游戏界面里的白键帽
        "inline-flex shrink-0 items-center justify-center bg-surface-inverse font-tech leading-none font-medium whitespace-nowrap text-ink-inverse",
        sizeClass[size],
        className,
      )}
    />
  );
}
