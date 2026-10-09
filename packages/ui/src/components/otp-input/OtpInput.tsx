import { OTPField as BaseOtpField } from "@base-ui/react/otp-field";
import { Fragment, useId, type ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { useFieldContext, useFieldControl } from "../field/Field";
import type { ControlSize, ControlVariant } from "../input/control-box";

export type OtpInputType = "numeric" | "alphanumeric";
export type OtpInputSize = ControlSize;
export type OtpInputVariant = ControlVariant;

export type OtpInputProps = Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue" | "children"
> & {
  /** 一共几位，默认 6 */
  length?: number;
  /** 拼起来的那一串 */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 每一位都填上了。粘贴一整串也算 */
  onComplete?: (value: string) => void;
  /** 收哪些字符：`numeric` 只收数字，默认；`alphanumeric` 收字母和数字 */
  type?: OtpInputType;
  /** 字母统一成大写：值也是大写，不只是看起来 */
  uppercase?: boolean;
  /** 把填进去的字遮成圆点 */
  mask?: boolean;
  /** 每几格之间加一道短横，如 6 位的码写 `3` 分成两组。只是画的 */
  groupSize?: number;
  /** 32 / 40 / 56px 见方 */
  size?: OtpInputSize;
  /** 同输入框：`sunken` 凹陷的底 + 底边线，默认；`outline` 四边描边 */
  variant?: OtpInputVariant;
  /** 错误态：每一格的边线变红。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** 传了就有一个隐藏字段随表单提交，值是拼起来的那一串 */
  name?: string;
  form?: string;
  /** 填满就提交所在的表单 */
  autoSubmit?: boolean;
  /** 挂载后焦点落在第一格 */
  autoFocus?: boolean;
  /** 第二格起每一格的可访问名称，默认"第 2 位，共 6 位"。第一格的名称是字段的标签 */
  slotLabel?: (position: number, length: number) => string;
};

/* 格子见方；容器窄了宽度可以让，高度不变 */
const slotSize: Record<ControlSize, string> = {
  sm: "h-8 w-8 text-base",
  md: "h-10 w-10 text-lg",
  lg: "h-14 w-14 text-2xl",
};

const slotFrame: Record<ControlVariant, string> = {
  sunken: "border-b-2",
  outline: "border",
};

const slotFill: Record<ControlVariant, string> = {
  sunken: "bg-surface-sunken",
  outline: "bg-surface",
};

const gapClass: Record<ControlSize, string> = {
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-2",
};

const defaultSlotLabel = (position: number, length: number) =>
  `第 ${position} 位，共 ${length} 位`;

const toUpperCase = (value: string) => value.toUpperCase();

/**
 * 验证码输入：一格一位的短码。每一格是一个真的输入框——打一位跳一格，
 * 粘贴一整串会分到各格，整组在 Tab 顺序里只停一次。
 *
 * 每个都要有标签：放进 `Field`，或者自己传 `aria-label`。
 * `className` 与 `ref` 给外面那一排。
 */
export function OtpInput({
  length = 6,
  value,
  defaultValue,
  onValueChange,
  onComplete,
  type = "numeric",
  uppercase = false,
  mask = false,
  groupSize,
  size = "md",
  variant = "sunken",
  invalid: invalidProp,
  id: idProp,
  disabled: disabledProp,
  required: requiredProp,
  readOnly = false,
  name,
  form,
  autoSubmit = false,
  autoFocus = false,
  slotLabel = defaultSlotLabel,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": describedByProp,
  className,
  ...props
}: OtpInputProps) {
  const fieldContext = useFieldContext();
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });
  const describedBy = field["aria-describedby"];

  // 基元不认第一格上的 aria-label（它要一个真的标签）：自己传名称时，
  // 把它写成一段隐藏的文字，让第一格和整组都指过去
  const labelId = useId();
  const ownLabel = ariaLabelledBy ?? (ariaLabel ? labelId : undefined);
  const groupLabel = ownLabel ?? fieldContext?.labelId;

  const slotClass = cn(
    "min-w-0 shrink text-center font-tech font-medium tabular-nums text-ink caret-ink",
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRing,
    slotSize[size],
    slotFrame[variant],
    readOnly
      ? // 只读：没有边线、底变透明。边线留透明的，尺寸不跳
        "border-transparent bg-transparent"
      : slotFill[variant],
    disabled
      ? "cursor-not-allowed border-line text-ink-disabled"
      : invalid
        ? "border-danger"
        : !readOnly &&
          // 悬停只在没聚焦时生效：聚焦中的格子不会因为鼠标经过而变浅
          "border-line-strong hover:not-focus:border-ink-secondary focus:border-ink",
  );

  const group = groupSize !== undefined && groupSize > 0 ? groupSize : 0;

  return (
    <BaseOtpField.Root
      {...props}
      id={id}
      length={length}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange && ((next) => onValueChange(next))}
      onValueComplete={onComplete && ((next) => onComplete(next))}
      validationType={type}
      normalizeValue={uppercase ? toUpperCase : undefined}
      mask={mask}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      name={name}
      form={form}
      autoSubmit={autoSubmit}
      aria-labelledby={groupLabel}
      aria-describedby={describedBy}
      data-size={size}
      data-variant={variant}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        // 不许比容器宽：放在"靠左对齐"的弹性容器里时它是按内容定宽的，
        // 没有这一条格子就不会收窄，而是整排伸出去
        "flex max-w-full min-w-0 items-center",
        gapClass[size],
        className,
      )}
    >
      {ariaLabel && !ariaLabelledBy && (
        <span id={labelId} hidden>
          {ariaLabel}
        </span>
      )}
      {Array.from({ length }, (_, index) => (
        <Fragment key={index}>
          {group > 0 && index > 0 && index % group === 0 && (
            <span
              aria-hidden="true"
              data-separator=""
              className="h-0.5 w-2 shrink-0 bg-line-strong"
            />
          )}
          <BaseOtpField.Input
            // 第一格的名称是字段的标签（或者上面那段隐藏的文字），说明文字也挂在它上面
            {...(index === 0
              ? { "aria-labelledby": ownLabel, "aria-describedby": describedBy }
              : { "aria-label": slotLabel(index + 1, length) })}
            aria-invalid={invalid || undefined}
            autoFocus={autoFocus && index === 0}
            autoCapitalize={uppercase ? "characters" : "none"}
            className={slotClass}
          />
        </Fragment>
      ))}
    </BaseOtpField.Root>
  );
}
