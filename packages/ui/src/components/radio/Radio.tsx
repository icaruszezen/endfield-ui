import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import {
  choiceBox,
  choiceControl,
  choiceFrame,
  choiceLabel,
  choiceMark,
} from "../checkbox/choice-style";
import { useFieldContext } from "../field/Field";

type RadioGroupContextValue = {
  name: string;
  value: string | undefined;
  select: (value: string) => void;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type RadioGroupOrientation = "vertical" | "horizontal";

export type RadioGroupProps = Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue"
> & {
  /** 受控的当前值 */
  value?: string;
  /** 非受控时的初始值 */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 表单提交用的字段名，缺省自动生成 */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /** 竖排（默认）或横排 */
  orientation?: RadioGroupOrientation;
};

/**
 * 单选组。方向键在组内移动并选中，这是原生单选的行为，组件不另外处理。
 * 标签用 `<Field group label="…">` 包住它，或者自己传 `aria-label`。
 */
export function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  name,
  disabled: disabledProp,
  required: requiredProp,
  orientation = "vertical",
  className,
  ...props
}: RadioGroupProps) {
  const field = useFieldContext();
  const autoName = useId();
  const [current, setCurrent] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  });

  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;
  const invalid = field?.invalid ?? false;
  const groupName = name ?? autoName;

  const context = useMemo<RadioGroupContextValue>(
    () => ({
      name: groupName,
      value: current,
      select: setCurrent,
      disabled,
      required,
      invalid,
    }),
    [groupName, current, setCurrent, disabled, required, invalid],
  );

  return (
    <RadioGroupContext value={context}>
      <div
        role="radiogroup"
        // 字段是 <fieldset> 时名称由 <legend> 给；否则指向字段的标签
        aria-labelledby={field && !field.group ? field.labelId : undefined}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        {...props}
        data-orientation={orientation}
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-col" : "flex-wrap gap-x-6",
          className,
        )}
      />
    </RadioGroupContext>
  );
}

export type RadioProps = Omit<
  ComponentProps<"input">,
  "type" | "size" | "value"
> & {
  value: string;
  /** 右侧的文字标签。不传时必须自己给 `aria-label` */
  children?: ReactNode;
};

/**
 * 单选框，放在 `RadioGroup` 里。`className` 给整行，其余属性与 `ref` 给 `<input>`。
 * 脱离 `RadioGroup` 时就是一个原生单选，自己管 `name` 与 `checked`。
 */
export function Radio({
  value,
  disabled,
  onChange,
  className,
  children,
  ...props
}: RadioProps) {
  const group = useContext(RadioGroupContext);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.target.checked) group?.select(value);
  };

  const groupProps = group
    ? {
        name: group.name,
        checked: group.value === value,
        required: group.required,
        "aria-invalid": group.invalid || undefined,
      }
    : {};

  return (
    <label className={cn(choiceLabel, className)}>
      <span className={choiceControl}>
        <span className={choiceFrame}>
          <input
            {...props}
            {...groupProps}
            type="radio"
            value={value}
            disabled={disabled ?? group?.disabled}
            onChange={handleChange}
            className={cn(
              choiceBox,
              "rounded-full choice-diamond:rounded-none",
              focusRing,
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              choiceMark,
              "size-2 rounded-full bg-accent-ink-inverse peer-checked:opacity-100 peer-disabled:bg-ink-disabled choice-diamond:hidden",
            )}
          />
        </span>
      </span>
      {children !== undefined && <span className="min-w-0">{children}</span>}
    </label>
  );
}
