import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Tag } from "../tag/Tag";

export type StatSize = "md" | "lg";
export type StatTrend = "up" | "down";

export type StatProps = Omit<ComponentProps<"div">, "children"> & {
  /** 微标，说明这是什么数。前面的 `//` 由组件加，不用自己写 */
  label: ReactNode;
  /** 主角：一个需要被一眼看到的数字 */
  value: ReactNode;
  /** 单位，小一号、与数字基线对齐 */
  unit?: ReactNode;
  /** 增量，连同正负号一起传，如 `+6%`、`−2%` */
  delta?: ReactNode;
  /** `up` 渲染为增益签，默认；`down` 渲染为危险色文字 */
  trend?: StatTrend;
  /** 并排几个时，让最重要的那个用 `lg` */
  size?: StatSize;
};

const valueSize: Record<StatSize, string> = {
  md: "text-4xl",
  lg: "text-5xl",
};

/** 统计块：不装进卡片，只用左缘一条墨色竖线。 */
export function Stat({
  label,
  value,
  unit,
  delta,
  trend = "up",
  size = "md",
  className,
  ...props
}: StatProps) {
  const hasDelta = delta !== undefined && delta !== null;

  return (
    <div
      {...props}
      data-size={size}
      className={cn("min-w-0 border-l-4 border-ink pl-4 text-ink", className)}
    >
      <p className="font-tech text-xs tracking-label text-ink-secondary">
        <span aria-hidden="true">{"// "}</span>
        {label}
      </p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={cn(
            "min-w-0 font-tech leading-none font-medium wrap-anywhere tabular-nums",
            valueSize[size],
          )}
        >
          {value}
        </span>
        {unit !== undefined && unit !== null && (
          <span className="text-sm text-ink-secondary">{unit}</span>
        )}
        {hasDelta &&
          (trend === "down" ? (
            <span
              data-trend="down"
              className="font-tech text-sm font-bold text-danger tabular-nums"
            >
              {delta}
            </span>
          ) : (
            <Tag variant="gain" size="sm" numeric data-trend="up">
              {delta}
            </Tag>
          ))}
      </p>
    </div>
  );
}
