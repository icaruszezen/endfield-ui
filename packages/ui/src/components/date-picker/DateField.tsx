import { Popover as BasePopover } from "@base-ui/react/popover";
import { useRef, type ReactNode, type Ref } from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { CalendarIcon } from "../../icons/CalendarIcon";
import { StatusDanger } from "../../icons/StatusDanger";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { menuPanel } from "../dropdown-menu/menu-style";
import {
  controlBox,
  controlIconSize,
  controlSize,
  type ControlSize,
  type ControlVariant,
} from "../input/control-box";

/*
 * 日期选择和日期范围共用的那层壳：输入框的外框 + 一个按钮 + 一块气泡面板。
 * 不对外导出。面板里放什么（月历、底下那一行）由两个控件各自给。
 */

/** 和日期块、微标行同一种写法：`2026.10.09` */
export const dottedDate = (date: string) => date.replaceAll("-", ".");

/** 面板底下那一行里的文字钮 */
export const dateFooterButton = cn(
  "px-2 py-1 text-sm font-medium text-ink underline underline-offset-4 hover:text-ink-secondary",
  "disabled:cursor-not-allowed disabled:text-ink-disabled disabled:no-underline",
  focusRing,
);

export type DateFieldProps = {
  /** 外框里显示的值；没选时传 `null`，显示 `placeholder` */
  display: ReactNode | null;
  placeholder: ReactNode;
  /** 随表单提交用的隐藏字段 */
  fields?: ReactNode;
  variant: ControlVariant;
  size: ControlSize;
  invalid: boolean;
  disabled: boolean;
  required: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 面板的可访问名称 */
  panelLabel: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** 给外框 */
  className?: string;
  /** 给触发按钮 */
  ref?: Ref<HTMLButtonElement>;
  /** 面板里的东西 */
  children: ReactNode;
};

export function DateField({
  display,
  placeholder,
  fields,
  variant,
  size,
  invalid,
  disabled,
  required,
  open,
  onOpenChange,
  panelLabel,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  className,
  ref,
  children,
}: DateFieldProps) {
  const { anchorRef, portalRef } = usePortalScope();
  const boxRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const iconSize = controlIconSize[size];

  return (
    <BasePopover.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
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
          aria-describedby={describedBy}
          className="flex h-full min-w-0 flex-1 cursor-default items-center gap-2 px-3 text-left outline-none disabled:cursor-not-allowed"
        >
          {display === null ? (
            <span className="min-w-0 flex-1 truncate text-ink-tertiary">
              {placeholder}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate font-tech tabular-nums">
              {display}
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
        {fields}
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
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
