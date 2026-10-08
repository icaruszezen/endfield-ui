import { useState, type ChangeEvent, type ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { useFieldControl } from "../field/Field";
import {
  controlBox,
  controlElement,
  type ControlVariant,
} from "../input/control-box";

export type TextareaProps = ComponentProps<"textarea"> & {
  /** `sunken` 凹陷底 + 底边线（默认），或 `outline` 四边描边 */
  variant?: ControlVariant;
  /** 错误态：底边线变红。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
  /** 在右下角显示字数；有 `maxLength` 时显示成 `12 / 200` */
  showCount?: boolean;
};

/**
 * 多行文本，最少三行。`className` 给外框，其余属性与 `ref` 给里面的 `<textarea>`。
 */
export function Textarea({
  variant = "sunken",
  invalid: invalidProp,
  showCount = false,
  id: idProp,
  disabled: disabledProp,
  required: requiredProp,
  readOnly = false,
  "aria-describedby": describedByProp,
  rows = 3,
  maxLength,
  value,
  defaultValue,
  onChange,
  className,
  ...props
}: TextareaProps) {
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });

  // 非受控时自己记字数；受控时直接量 value
  const [innerLength, setInnerLength] = useState(
    () => String(defaultValue ?? "").length,
  );
  const length = value !== undefined ? String(value).length : innerLength;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInnerLength(event.target.value.length);
    onChange?.(event);
  };

  return (
    <div
      data-variant={variant}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        controlBox({ variant, invalid, disabled, readOnly }),
        "flex-col text-base",
        className,
      )}
    >
      <textarea
        {...props}
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={field["aria-describedby"]}
        className={cn(
          controlElement,
          "block min-h-[calc(3lh+1rem)] w-full resize-y px-3 py-2",
        )}
      />
      {showCount && (
        <span
          data-count=""
          className={cn(
            "pointer-events-none self-end px-3 pb-1.5 font-tech text-xs tabular-nums",
            disabled ? "text-ink-disabled" : "text-ink-secondary",
          )}
        >
          {maxLength !== undefined ? `${length} / ${maxLength}` : length}
        </span>
      )}
    </div>
  );
}
