import type { ReactNode, Ref } from "react";
import { useControllableState } from "../../hooks/useControllableState";
import {
  Calendar,
  type CalendarProps,
  type DateRange,
} from "../calendar/Calendar";
import { useFieldControl } from "../field/Field";
import type { ControlSize, ControlVariant } from "../input/control-box";
import { DateField, dateFooterButton, dottedDate } from "./DateField";

export type DateRangePickerProps = Pick<
  CalendarProps,
  "min" | "max" | "isDateDisabled" | "weekStartsOn" | "locale" | "today"
> & {
  /** 选中的那一段，`[起, 止]`，两头都包含；没选是 `null` */
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  /** 一段选完才触发；清除之后拿到的是 `null` */
  onValueChange?: (value: DateRange | null) => void;
  /** 没选时显示的提示 */
  placeholder?: ReactNode;
  /** 表单字段名：起始日和结束日各一个，值是 `YYYY-MM-DD` */
  startName?: string;
  endName?: string;
  /**
   * 外框的画法，和输入框相同：
   * - `sunken` 凹陷的底 + 一条底边线，默认；
   * - `outline` 四边描边，放在凹陷底色的区域里时用。
   */
  variant?: ControlVariant;
  /** 32 / 40 / 56px 高 */
  size?: ControlSize;
  /** 每个日期怎么写。默认 `2026.10.09` */
  format?: (date: string) => ReactNode;
  /** 错误态。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
  disabled?: boolean;
  /** 必填：面板里没有"清除" */
  required?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 面板的可访问名称 */
  panelLabel?: string;
  /** 面板底下那句提示 */
  hint?: ReactNode;
  clearLabel?: string;
  /** 读屏在两端那两天的名称后面听到的词 */
  startLabel?: string;
  endLabel?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** 给外框 */
  className?: string;
  /** 给触发按钮 */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * 日期范围：一个字段，点开是一块带月历的面板，点两下选出起止两天。
 * 值是 `[起, 止]`，两头都包含；结束日选完面板才关。
 * 每个字段都要有标签：放进 `Field`，或者自己传 `aria-label`。
 */
export function DateRangePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  placeholder = "选择起止日期",
  startName,
  endName,
  variant = "sunken",
  size = "md",
  format = dottedDate,
  invalid: invalidProp,
  disabled: disabledProp,
  required: requiredProp,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  panelLabel = "选择起止日期",
  hint = "先选起始日，再选结束日",
  clearLabel = "清除",
  startLabel,
  endLabel,
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  locale,
  today,
  id: idProp,
  "aria-label": ariaLabel,
  "aria-describedby": describedByProp,
  className,
  ref,
}: DateRangePickerProps) {
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });

  const [value, setValue] = useControllableState<DateRange | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const pick = (next: DateRange | null) => {
    setValue(next);
    setOpen(false);
  };

  return (
    <DateField
      ref={ref}
      id={id}
      display={
        value === null ? null : value[0] === value[1] ? (
          // 起止是同一天：只写一个
          format(value[0])
        ) : (
          <>
            {format(value[0])}
            <span aria-hidden="true" className="mx-1.5 text-ink-tertiary">
              –
            </span>
            <span className="sr-only">至</span>
            {format(value[1])}
          </>
        )
      }
      placeholder={placeholder}
      variant={variant}
      size={size}
      invalid={invalid}
      disabled={disabled}
      required={required}
      open={open}
      onOpenChange={setOpen}
      panelLabel={panelLabel}
      aria-label={ariaLabel}
      aria-describedby={field["aria-describedby"]}
      className={className}
      fields={
        <>
          {startName !== undefined && (
            <input
              type="hidden"
              name={startName}
              value={value?.[0] ?? ""}
              disabled={disabled}
            />
          )}
          {endName !== undefined && (
            <input
              type="hidden"
              name={endName}
              value={value?.[1] ?? ""}
              disabled={disabled}
            />
          )}
        </>
      }
    >
      <Calendar
        range
        value={value}
        onValueChange={pick}
        min={min}
        max={max}
        isDateDisabled={isDateDisabled}
        weekStartsOn={weekStartsOn}
        locale={locale}
        today={today}
        startLabel={startLabel}
        endLabel={endLabel}
      />
      <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
        <p className="px-2 text-xs text-ink-secondary">{hint}</p>
        {!required && (
          <button
            type="button"
            disabled={value === null}
            onClick={() => pick(null)}
            className={dateFooterButton}
          >
            {clearLabel}
          </button>
        )}
      </div>
    </DateField>
  );
}
