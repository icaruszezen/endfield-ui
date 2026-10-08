import type { ComponentProps, ReactNode } from "react";
import { StatusDanger } from "../../icons/StatusDanger";
import { cn } from "../../lib/cn";
import { useFieldControl } from "../field/Field";
import {
  controlBox,
  controlElement,
  type ControlVariant,
} from "./control-box";

export type InputSize = "sm" | "md" | "lg";
export type InputVariant = ControlVariant;

export type InputProps = Omit<ComponentProps<"input">, "size"> & {
  /**
   * - `sunken` 凹陷的底 + 一条底边线，默认；
   * - `outline` 四边描边，放在凹陷底色的区域（工具条、筛选栏）里时用。
   */
  variant?: InputVariant;
  /** 32 / 40 / 56px 高 */
  size?: InputSize;
  /** 框内左端：图标 */
  start?: ReactNode;
  /** 框内右端：单位、清除按钮 */
  end?: ReactNode;
  /** 错误态：底边线变红，右侧出现菱形图标。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
};

const boxSize: Record<InputSize, string> = {
  sm: "h-8 text-sm",
  md: "h-10 text-base",
  lg: "h-14 text-lg",
};

const iconSize: Record<InputSize, number> = { sm: 14, md: 16, lg: 20 };

/**
 * 单行输入框。`className` 给外框，其余属性与 `ref` 给里面的 `<input>`。
 * 每个输入框都要有标签：放进 `Field`，或者自己传 `aria-label`。
 */
export function Input({
  variant = "sunken",
  size = "md",
  start,
  end,
  invalid: invalidProp,
  id: idProp,
  disabled: disabledProp,
  required: requiredProp,
  readOnly = false,
  "aria-describedby": describedByProp,
  className,
  ...props
}: InputProps) {
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });

  return (
    <div
      data-variant={variant}
      data-size={size}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        controlBox({ variant, invalid, disabled, readOnly }),
        "items-center",
        boxSize[size],
        className,
      )}
    >
      {start && (
        <span className="flex shrink-0 items-center pl-3 text-ink-secondary">
          {start}
        </span>
      )}
      <input
        {...props}
        id={id}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={field["aria-describedby"]}
        className={cn(
          controlElement,
          "h-full",
          start ? "pl-2" : "pl-3",
          end || invalid ? "pr-2" : "pr-3",
        )}
      />
      {invalid && (
        <StatusDanger
          size={iconSize[size]}
          className={cn("shrink-0 text-danger", !end && "mr-3")}
        />
      )}
      {end && (
        <span
          className={cn(
            "flex shrink-0 items-center pr-3 text-sm text-ink-secondary",
            invalid && "pl-2",
          )}
        >
          {end}
        </span>
      )}
    </div>
  );
}
