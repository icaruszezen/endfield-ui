import { Slider as BaseSlider } from "@base-ui/react/slider";
import { useMemo, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { focusRingWithin } from "../../lib/focus-ring";
import { useFieldContext, useFieldControl } from "../field/Field";

export type SliderSize = "sm" | "md";

export type SliderMark = {
  value: number;
  /** 刻度下面的标注；不传就只有一条短线 */
  label?: ReactNode;
};

type SliderCommonProps = {
  /** 下限，默认 0 */
  min?: number;
  /** 上限，默认 100 */
  max?: number;
  /** 一步走多少，默认 1 */
  step?: number;
  /** `PageUp` / `PageDown`、`Shift` + 方向键一次走多少，默认 10 */
  largeStep?: number;
  /** 整个控件占 32 / 40px 高，默认 `md` */
  size?: SliderSize;
  /** 在右侧显示当前值 */
  showValue?: boolean;
  /** 数值怎么写：`Intl.NumberFormat` 的选项（百分比、单位、小数位） */
  format?: Intl.NumberFormatOptions;
  /** 轨道下面的刻度。只是标注，不改变步长 */
  marks?: readonly SliderMark[];
  /** 表单字段名：值随表单提交 */
  name?: string;
  disabled?: boolean;
  /** 不在 `Field` 里时必须给 */
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
};

export type SliderSingleProps = SliderCommonProps & {
  value?: number;
  defaultValue?: number;
  /** 拖动的每一步都触发 */
  onValueChange?: (value: number) => void;
  /** 松手（或一次按键）之后触发：要发请求的事放这里 */
  onValueCommitted?: (value: number) => void;
  thumbLabels?: never;
  minStepsBetweenValues?: never;
};

export type SliderRangeProps = SliderCommonProps & {
  /** 传两个数就是范围滑块 */
  value?: readonly [number, number];
  defaultValue?: readonly [number, number];
  onValueChange?: (value: [number, number]) => void;
  onValueCommitted?: (value: [number, number]) => void;
  /** 两个滑块各自的名称，默认"最小值""最大值" */
  thumbLabels?: readonly [string, string];
  /** 两个滑块之间至少隔几步，默认 0 */
  minStepsBetweenValues?: number;
};

export type SliderProps = SliderSingleProps | SliderRangeProps;

const controlSize: Record<SliderSize, string> = {
  sm: "h-8",
  md: "h-10",
};

/*
 * 轨道两端各缩进半个滑块（6px）：滑块到头时它的外缘正好和别的字段对齐，不伸出去。
 * 刻度按同样的算法落位，才对得上滑块的中心。
 * （没有用基元的 thumbAlignment="edge"：它要先量一遍尺寸才显示滑块，服务端渲染时是空的）
 */
const THUMB_HALF = 6;
const markLeft = (ratio: number) =>
  `calc(${THUMB_HALF}px + (100% - ${THUMB_HALF * 2}px) * ${ratio})`;

const thumb = [
  "relative h-5 w-3 bg-surface-inverse shadow-[0_0_0_2px_var(--ef-surface)]",
  // 触屏的点击区补到 40 × 40px
  "before:absolute before:-inset-x-3.5 before:-inset-y-2.5 before:content-['']",
  // 按住时正中亮一条强调色细线
  "after:absolute after:inset-y-1 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-accent-ink-inverse after:opacity-0 after:content-[''] data-dragging:after:opacity-100",
  // 菱形方案：滑块是一个 14px 的菱形，按住时中间亮一个小方块
  "choice-diamond:size-3.5 choice-diamond:rotate-45 choice-diamond:after:inset-1 choice-diamond:after:w-auto choice-diamond:after:translate-x-0",
  "data-disabled:bg-ink-disabled",
  focusRingWithin,
].join(" ");

/**
 * 滑块：在一个范围里拖着选一个数。要的是确切的数时用 `Stepper`。
 * 每个滑块都要有名称：放进 `Field`，或者自己传 `aria-label`。
 */
export function Slider(props: SliderProps) {
  const {
    min = 0,
    max = 100,
    step = 1,
    largeStep = 10,
    size = "md",
    showValue = false,
    format,
    marks,
    name,
    disabled: disabledProp,
    "aria-label": ariaLabel,
    "aria-describedby": describedByProp,
    className,
  } = props;
  const field = useFieldContext();
  const { disabled, "aria-describedby": describedBy } = useFieldControl({
    disabled: disabledProp,
    "aria-describedby": describedByProp,
  });
  const labelledBy = ariaLabel ? undefined : field?.labelId;
  const range = Array.isArray(props.value ?? props.defaultValue);
  const thumbLabels = props.thumbLabels ?? (["最小值", "最大值"] as const);

  // 数值区按最宽的那个值留宽：拖动时轨道不跟着伸缩
  const valueWidth = useMemo(() => {
    const formatter = new Intl.NumberFormat(undefined, format);
    const widest = Math.max(
      formatter.format(min).length,
      formatter.format(max).length,
    );
    return `${range ? widest * 2 + 3 : widest}ch`;
  }, [format, min, max, range]);

  return (
    <BaseSlider.Root
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={(next) =>
        (props.onValueChange as ((value: unknown) => void) | undefined)?.(next)
      }
      onValueCommitted={(next) =>
        (props.onValueCommitted as ((value: unknown) => void) | undefined)?.(
          next,
        )
      }
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      minStepsBetweenValues={props.minStepsBetweenValues}
      thumbCollisionBehavior="none"
      format={format}
      name={name}
      disabled={disabled}
      // 范围滑块是一个有名称的分组，里面两个滑块各有各的名称
      {...(range && {
        "aria-label": ariaLabel,
        "aria-labelledby": labelledBy,
      })}
      data-size={size}
      className={cn("flex w-full items-start gap-3 text-ink", className)}
    >
      <div className="min-w-0 flex-1">
        <BaseSlider.Control
          className={cn(
            "flex touch-none items-center px-1.5 select-none data-disabled:cursor-not-allowed",
            controlSize[size],
          )}
        >
          <BaseSlider.Track className="h-1 w-full bg-line">
            <BaseSlider.Indicator className="bg-ink data-disabled:bg-ink-disabled" />
            {(range ? [0, 1] : [0]).map((index) => (
              <BaseSlider.Thumb
                key={index}
                index={index}
                {...(range
                  ? { "aria-label": thumbLabels[index] }
                  : { "aria-label": ariaLabel, "aria-labelledby": labelledBy })}
                aria-describedby={describedBy}
                className={thumb}
              />
            ))}
          </BaseSlider.Track>
        </BaseSlider.Control>

        {marks && marks.length > 0 && (
          <div aria-hidden="true" className="relative h-6 text-xs">
            {marks.map((mark) => (
              <span
                key={mark.value}
                style={{ left: markLeft((mark.value - min) / (max - min)) }}
                className={cn(
                  "absolute top-0 flex flex-col gap-0.5 whitespace-nowrap text-ink-secondary before:h-1.5 before:w-px before:bg-line-strong before:content-['']",
                  // 两端的标注朝里排，不伸到控件外面去；短线仍然对着滑块的中心
                  mark.value <= min
                    ? "items-start"
                    : mark.value >= max
                      ? "-translate-x-full items-end"
                      : "-translate-x-1/2 items-center",
                )}
              >
                {mark.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {showValue && (
        <BaseSlider.Value
          style={{ minWidth: valueWidth }}
          className={cn(
            "flex shrink-0 items-center justify-end font-tech text-sm font-bold tabular-nums data-disabled:text-ink-disabled",
            controlSize[size],
          )}
        >
          {(formatted) => formatted.join(" – ")}
        </BaseSlider.Value>
      )}
    </BaseSlider.Root>
  );
}
