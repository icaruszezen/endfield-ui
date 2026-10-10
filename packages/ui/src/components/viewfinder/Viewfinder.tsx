import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";

export type ViewfinderSize = "sm" | "md";

export type ViewfinderReadouts = {
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
};

export type ViewfinderProps = ComponentProps<"div"> & {
  /** 取景角的臂长：16px 或 24px */
  size?: ViewfinderSize;
  /** 正中放一个小准星，标出焦点 */
  crosshair?: boolean;
  /**
   * 挂上的时候取景角落位：八段短线各自从角上伸出来，播一次。
   * 默认不动——取景角平时是静态的装饰。要它晚一点再动（等外面那一层先淡入完），
   * 在外层设 `--bracket-delay`
   */
  animate?: boolean;
  /**
   * 四个角上的读数：坐标、比例、版本、时间码。
   * 必须是真实的数据；没有就不放。
   */
  readouts?: ViewfinderReadouts;
};

const armClass: Record<ViewfinderSize, string> = {
  sm: "[--bracket-arm:16px]",
  md: "[--bracket-arm:24px]",
};

const readoutPosition: Record<keyof ViewfinderReadouts, string> = {
  topLeft: "top-5 left-5",
  topRight: "top-5 right-5 text-right",
  bottomLeft: "bottom-5 left-5",
  bottomRight: "right-5 bottom-5 text-right",
};

/**
 * 取景角：框住一张图、一片地图区域、一个焦点，标的是"范围"，不是选中。
 * 里面放被框住的内容；压在深色画面上时给它加 `data-theme="dark"`。
 *
 * 只用在展示性的画面上，一屏一处。取景角与准星是装饰，读数是真实信息、读屏读得到。
 */
export function Viewfinder({
  size = "sm",
  crosshair = false,
  animate = false,
  readouts,
  className,
  children,
  ...props
}: ViewfinderProps) {
  return (
    <div {...props} className={cn("relative text-ink", className)}>
      {children}
      <span
        aria-hidden="true"
        className={cn(
          decor,
          "corner-brackets absolute inset-3 [--bracket-color:currentColor] [--bracket-offset:0px] [--bracket-width:1.5px]",
          armClass[size],
          animate &&
            "after:animate-bracket-in after:[animation-delay:var(--bracket-delay,0s)]",
        )}
      />
      {crosshair && (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={cn(
            decor,
            "absolute top-1/2 left-1/2 size-3 -translate-1/2 text-accent-ink",
          )}
        >
          <path d="M6 0v12M0 6h12" />
        </svg>
      )}
      {readouts &&
        (Object.keys(readoutPosition) as (keyof ViewfinderReadouts)[]).map(
          (corner) =>
            readouts[corner] !== undefined && (
              <span
                key={corner}
                data-corner={corner}
                className={cn(
                  "pointer-events-none absolute font-tech text-xs leading-none text-ink-secondary tabular-nums",
                  readoutPosition[corner],
                )}
              >
                {readouts[corner]}
              </span>
            ),
        )}
    </div>
  );
}
