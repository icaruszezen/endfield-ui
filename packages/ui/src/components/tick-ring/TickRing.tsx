import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";

export type TickRingProps = Omit<ComponentProps<"div">, "children"> & {
  /** 直径：数字是像素，也可以传 `"100%"` 这类长度（高度跟着宽度走）。默认 240 */
  size?: number | string;
  /** 外圈刻度的根数，默认 40 */
  ticks?: number;
  /** 整体缓慢匀速旋转（60 秒一圈） */
  spin?: boolean;
  /** 被圆环围住的主体，居中 */
  children?: ReactNode;
};

/**
 * 刻度圆环：细内环 + 一圈刻度 + 两段不对称的粗弧，围住一个主体（模型、头像、地图焦点）。
 * 纯装饰，只用在展示性的画面上。颜色继承文字：浅色底上是墨与灰，
 * 压在深色画面上时给它加 `data-theme="dark"`。
 *
 * 它不承载数据；表示进度用 `ProgressRing`。
 */
export function TickRing({
  size = 240,
  ticks = 40,
  spin = false,
  className,
  style,
  children,
  ...props
}: TickRingProps) {
  const count = Math.max(1, Math.round(ticks));

  return (
    <div
      {...props}
      className={cn(
        "relative inline-grid aspect-square shrink-0 place-items-center text-ink",
        className,
      )}
      style={{ width: size, ...style }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 240 240"
        fill="none"
        stroke="currentColor"
        className={cn(
          decor,
          "absolute inset-0 size-full",
          spin && "animate-spin-slow",
        )}
      >
        <circle cx="120" cy="120" r="96" strokeOpacity={0.35} />
        {/* pathLength 把周长归一化成"每根刻度 10 个单位"：短线 1.5、间隔 8.5 */}
        <circle
          data-ticks={count}
          cx="120"
          cy="120"
          r="114"
          strokeOpacity={0.5}
          strokeWidth={8}
          pathLength={count * 10}
          strokeDasharray="1.5 8.5"
        />
        {/* 两段弧一长一短、不对称摆放：等长对称的两段会被看成加载指示 */}
        <path
          d="M120 6A114 114 0 0 1 218.7 63M81 227.1A114 114 0 0 1 25.5 183.7"
          strokeOpacity={0.55}
          strokeWidth={5}
        />
      </svg>
      {children !== undefined && <div className="relative">{children}</div>}
    </div>
  );
}
