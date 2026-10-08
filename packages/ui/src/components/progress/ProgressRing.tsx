import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type ProgressRingProps = Omit<ComponentProps<"div">, "children"> & {
  /** 当前值。不传就是"不确定进度"：一段弧匀速旋转 */
  value?: number;
  /** 最大值，默认 100 */
  max?: number;
  /** 直径，像素，默认 48 */
  size?: number;
  /** 线宽，像素，缺省取直径的 9% */
  thickness?: number;
  /** 在中心显示百分比的数值，不带 `%` */
  showValue?: boolean;
  /** 中心的内容：图标或头像。传了就不显示数值 */
  children?: ReactNode;
};

/**
 * 进度环：细圆环轨道 + 从 12 点方向顺时针的黄弧。用在紧凑的位置，或者围住一个头像、图标。
 * 取色与 `Progress` 相同；需要名称时传 `aria-label`。
 */
export function ProgressRing({
  value,
  max = 100,
  size = 48,
  thickness,
  showValue = false,
  className,
  style,
  children,
  ...props
}: ProgressRingProps) {
  const stroke = thickness ?? Math.max(2, Math.round(size * 0.09));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const indeterminate = value === undefined;
  const current = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const ratio = max > 0 ? current / max : 0;

  const circle = {
    cx: size / 2,
    cy: size / 2,
    r: radius,
    fill: "none",
    strokeWidth: stroke,
  };

  let arc: ReactNode = null;
  if (indeterminate) {
    arc = (
      <>
        <circle
          {...circle}
          className="origin-center animate-spin stroke-action motion-reduce:hidden"
          strokeDasharray={`${circumference / 4} ${circumference}`}
        />
        {/* 减少动态效果时换成一圈虚线：静止的一段弧会被看成"进度 25%" */}
        <circle
          {...circle}
          className="hidden stroke-action motion-reduce:block"
          strokeDasharray={`${stroke} ${stroke * 2}`}
        />
      </>
    );
  } else if (ratio > 0) {
    arc = (
      <circle
        {...circle}
        className="stroke-action transition-[stroke-dashoffset] duration-(--duration-base) ease-standard"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
      />
    );
  }

  let center: ReactNode = null;
  if (children !== undefined) {
    center = (
      <span className="relative flex items-center justify-center">
        {children}
      </span>
    );
  } else if (showValue && !indeterminate) {
    center = (
      <span
        className="relative font-tech leading-none font-bold tabular-nums"
        style={{ fontSize: Math.round(size * 0.3) }}
      >
        {Math.round(ratio * 100)}
      </span>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : current}
      {...props}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center text-ink",
        className,
      )}
      style={{ width: size, height: size, ...style }}
    >
      {/* 整张图逆时针转 90°，弧的起点就落在 12 点方向 */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="absolute inset-0 -rotate-90"
      >
        <circle {...circle} className="stroke-line" />
        {arc}
      </svg>
      {center}
    </div>
  );
}
