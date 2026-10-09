import { Popover as BasePopover } from "@base-ui/react/popover";
import { useRef, type ReactNode, type Ref } from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { usePortalScope } from "../../hooks/usePortalScope";
import { CalendarIcon } from "../../icons/CalendarIcon";
import { StatusDanger } from "../../icons/StatusDanger";
import { cn } from "../../lib/cn";
import { clampDate, today as localToday } from "../../lib/date";
import { focusRing } from "../../lib/focus-ring";
import { Calendar, type CalendarProps } from "../calendar/Calendar";
import { menuPanel } from "../dropdown-menu/menu-style";
import { useFieldControl } from "../field/Field";
import {
  controlBox,
  controlIconSize,
  controlSize,
  type ControlSize,
  type ControlVariant,
} from "../input/control-box";

export type DatePickerSize = ControlSize;
export type DatePickerVariant = ControlVariant;

export type DatePickerProps = Pick<
  CalendarProps,
  "min" | "max" | "isDateDisabled" | "weekStartsOn" | "locale" | "today"
> & {
  /** 选中的那一天，`YYYY-MM-DD`；没选是 `null` */
  value?: string | null;
  defaultValue?: string | null;
  /** 清除之后拿到的是 `null` */
  onValueChange?: (value: string | null) => void;
  /** 没选时显示的提示 */
  placeholder?: ReactNode;
  /** 表单字段名：选中的值（`YYYY-MM-DD`）会随表单提交 */
  name?: string;
  /**
   * 外框的画法，和输入框相同：
   * - `sunken` 凹陷的底 + 一条底边线，默认；
   * - `outline` 四边描边，放在凹陷底色的区域里时用。
   */
  variant?: DatePickerVariant;
  /** 32 / 40 / 56px 高 */
  size?: DatePickerSize;
  /** 日期怎么写。默认 `2026.10.09` */
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
  todayLabel?: string;
  clearLabel?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** 给外框 */
  className?: string;
  /** 给触发按钮 */
  ref?: Ref<HTMLButtonElement>;
};

/** 和日期块、微标行同一种写法 */
const dotted = (date: string) => date.replaceAll("-", ".");

const footerButton = cn(
  "px-2 py-1 text-sm font-medium text-ink underline underline-offset-4 hover:text-ink-secondary",
  "disabled:cursor-not-allowed disabled:text-ink-disabled disabled:no-underline",
  focusRing,
);

/**
 * 日期选择：一个字段，点开是一块带月历的面板。值是 `YYYY-MM-DD` 的字符串。
 * 触发器是按钮，不能打字——要打字用原生的 `<Input type="date">`。
 * 每个日期选择都要有标签：放进 `Field`，或者自己传 `aria-label`。
 */
export function DatePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  placeholder = "选择日期",
  name,
  variant = "sunken",
  size = "md",
  format = dotted,
  invalid: invalidProp,
  disabled: disabledProp,
  required: requiredProp,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  panelLabel = "选择日期",
  todayLabel = "今天",
  clearLabel = "清除",
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  locale,
  today: todayProp,
  id: idProp,
  "aria-label": ariaLabel,
  "aria-describedby": describedByProp,
  className,
  ref,
}: DatePickerProps) {
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });
  const { anchorRef, portalRef } = usePortalScope();
  const boxRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const iconSize = controlIconSize[size];

  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const pick = (next: string | null) => {
    setValue(next);
    setOpen(false);
  };

  const todayDate = todayProp ?? localToday();
  const todayUnavailable =
    clampDate(todayDate, min, max) !== todayDate ||
    (isDateDisabled?.(todayDate) ?? false);

  return (
    <BasePopover.Root open={open} onOpenChange={(next) => setOpen(next)}>
      <div
        ref={(node) => {
          boxRef.current = node;
          anchorRef(node);
        }}
        data-variant={variant}
        data-size={size}
        data-invalid={invalid ? "" : undefined}
        className={cn(
          controlBox({ variant, invalid, disabled, readOnly: false }),
          // 面板开着的时候边线保持聚焦的墨色
          !disabled && !invalid && "has-data-popup-open:border-ink",
          controlSize[size],
          className,
        )}
      >
        <BasePopover.Trigger
          ref={ref}
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          aria-describedby={field["aria-describedby"]}
          className="flex h-full min-w-0 flex-1 cursor-default items-center gap-2 px-3 text-left outline-none disabled:cursor-not-allowed"
        >
          {value === null ? (
            <span className="min-w-0 flex-1 truncate text-ink-tertiary">
              {placeholder}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate font-tech tabular-nums">
              {format(value)}
            </span>
          )}
          {invalid && (
            <StatusDanger size={iconSize} className="shrink-0 text-danger" />
          )}
          <CalendarIcon
            size={iconSize}
            className={cn(
              "shrink-0",
              disabled ? "text-ink-disabled" : "text-ink-secondary",
            )}
          />
        </BasePopover.Trigger>
        {name !== undefined && (
          <input
            type="hidden"
            name={name}
            value={value ?? ""}
            disabled={disabled}
          />
        )}
      </div>

      <BasePopover.Portal ref={portalRef}>
        <BasePopover.Positioner
          // 面板对着外框落位，不是对着里面的按钮：否则差出一条边线的宽度
          anchor={boxRef}
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-(--z-overlay) outline-none"
        >
          <BasePopover.Popup
            ref={popupRef}
            aria-label={panelLabel}
            // 打开时焦点落在月历里能被 Tab 停到的那一天：选中的，没选时是今天
            initialFocus={() =>
              popupRef.current?.querySelector<HTMLElement>(
                '[data-date][tabindex="0"]',
              ) ?? true
            }
            className={cn(menuPanel, "flex flex-col gap-2 p-2")}
          >
            <Calendar
              value={value}
              onValueChange={pick}
              min={min}
              max={max}
              isDateDisabled={isDateDisabled}
              weekStartsOn={weekStartsOn}
              locale={locale}
              today={todayProp}
            />
            <div className="flex items-center justify-between border-t border-line pt-2">
              <button
                type="button"
                disabled={todayUnavailable}
                onClick={() => pick(todayDate)}
                className={footerButton}
              >
                {todayLabel}
              </button>
              {!required && (
                <button
                  type="button"
                  disabled={value === null}
                  onClick={() => pick(null)}
                  className={footerButton}
                >
                  {clearLabel}
                </button>
              )}
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
