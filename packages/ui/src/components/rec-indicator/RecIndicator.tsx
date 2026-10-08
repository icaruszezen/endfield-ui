import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type RecIndicatorProps = Omit<ComponentProps<"span">, "children"> & {
  /** 方括号里的字，默认 `REC`；直播、实时数据可以写 `LIVE` */
  label?: ReactNode;
  /** 红点硬切明灭，默认开。关掉后红点常亮 */
  blink?: boolean;
};

/**
 * 录制指示：一个红点 + `[ REC ]`。
 * 只在确有"进行中"的语义时用（正在录制、直播中、实时数据），不要当氛围装饰——
 * 红色在这套语言里是危险与紧急。
 */
export function RecIndicator({
  label = "REC",
  blink = true,
  className,
  ...props
}: RecIndicatorProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 font-tech text-xs leading-none font-medium whitespace-nowrap text-ink uppercase",
        className,
      )}
    >
      {/* 有意不随主题变：角色色里的"危险"红，作填充用 */}
      <span
        aria-hidden="true"
        className={cn(
          "mr-0.5 size-2 shrink-0 rounded-full bg-alert",
          blink && "animate-blink",
        )}
      />
      <span aria-hidden="true" className="text-ink-tertiary">
        [
      </span>
      <span>{label}</span>
      <span aria-hidden="true" className="text-ink-tertiary">
        ]
      </span>
    </span>
  );
}
