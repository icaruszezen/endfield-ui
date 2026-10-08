import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type SparklineVariant = "area" | "line";
export type SparklineTone = "info" | "danger" | "accent" | "neutral";

export type SparklineProps = Omit<ComponentProps<"svg">, "children"> & {
  /** 一串数值，按先后顺序。少于两个点时什么都不画 */
  data: readonly number[];
  /** `area` 一块填充的面积，默认；`line` 一条折线 */
  variant?: SparklineVariant;
  /**
   * - `info` 量值图表的蓝，默认；
   * - `danger` 超支、异常的红；
   * - `accent` 强调色；
   * - `neutral` 次要的墨色。
   */
  tone?: SparklineTone;
  /** 纵向范围的下端。默认从数据的最小值往下再留四分之一，让最低的那一点也有厚度 */
  min?: number;
  /** 纵向范围的上端。默认是数据的最大值 */
  max?: number;
  /** 传了它就是一张有名称的图；不传是纯装饰，对读屏隐藏 */
  label?: string;
};

/* 画在一个 100 × 100 的格子里，再由 SVG 拉伸到实际的盒子 */
const SIZE = 100;

/** 保留两位小数：路径短一点，快照也稳定 */
const round = (value: number) => Math.round(value * 100) / 100;

/**
 * 把一串数值换算成折线与面积的路径（100 × 100 的坐标系，y 向下）。
 * 少于两个点时返回 `null`。
 */
export function sparklinePath(
  data: readonly number[],
  range: { min?: number; max?: number } = {},
): { line: string; area: string } | null {
  if (data.length < 2) return null;

  const low = Math.min(...data);
  const high = Math.max(...data);
  const max = range.max ?? high;
  const min = range.min ?? low - (high - low) * 0.25;
  // 所有的值都一样（或范围给反了）时没有高低可言，画在正中
  const span = max - min;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * SIZE;
    const ratio = span > 0 ? (value - min) / span : 0.5;
    const y = SIZE - Math.min(Math.max(ratio, 0), 1) * SIZE;
    return `${round(x)} ${round(y)}`;
  });

  const line = `M${points.join("L")}`;
  return { line, area: `${line}L${SIZE} ${SIZE}L0 ${SIZE}Z` };
}

/* data 与 alert 是不随主题变的角色色：白底和深色行带上都认得出 */
const areaClass: Record<SparklineTone, string> = {
  info: "fill-data/75",
  danger: "fill-alert/75",
  accent: "fill-accent-ink/75",
  neutral: "fill-ink-secondary/75",
};

const lineClass: Record<SparklineTone, string> = {
  info: "stroke-data",
  danger: "stroke-alert",
  accent: "stroke-accent-ink",
  neutral: "stroke-ink-secondary",
};

/**
 * 行内的小型图表：没有坐标轴、网格和图例，只有一块面积或一条折线。
 * 撑满给它的盒子（默认高 32px、通宽）。它旁边应该有数字——图只是帮着看趋势。
 */
export function Sparkline({
  data,
  variant = "area",
  tone = "info",
  min,
  max,
  label,
  className,
  ...props
}: SparklineProps) {
  const path = sparklinePath(data, { min, max });

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      preserveAspectRatio="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
      data-variant={variant}
      data-tone={tone}
      {...props}
      // 折线贴着上下边缘时，线宽的一半会落在盒子外面
      className={cn("block h-8 w-full overflow-visible", className)}
    >
      {path &&
        (variant === "area" ? (
          <path d={path.area} className={areaClass[tone]} />
        ) : (
          <path
            d={path.line}
            fill="none"
            strokeWidth={1.5}
            strokeLinejoin="miter"
            // 图被横向拉伸了，线宽不跟着变
            vectorEffect="non-scaling-stroke"
            className={lineClass[tone]}
          />
        ))}
    </svg>
  );
}
