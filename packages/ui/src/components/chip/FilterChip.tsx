import type { ComponentProps, MouseEvent } from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import {
  capsuleBase,
  capsuleSize,
  capsuleState,
  type CapsuleSize,
} from "./capsule-style";

export type FilterChipProps = Omit<ComponentProps<"button">, "aria-pressed"> & {
  /** 受控的选中状态 */
  selected?: boolean;
  /** 非受控时的初始状态 */
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  size?: CapsuleSize;
};

/**
 * 筛选胶囊：一个可以独立开关的条件，几个并排就是多选筛选。
 * 几项里只能选一项时用 `Tabs` 的 `capsule` 变体或单选。
 */
export function FilterChip({
  selected,
  defaultSelected = false,
  onSelectedChange,
  size = "md",
  disabled = false,
  type = "button",
  className,
  onClick,
  ...props
}: FilterChipProps) {
  const [on, setOn] = useControllableState({
    value: selected,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  });

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-pressed={on}
      data-selected={on ? "" : undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOn(!on);
      }}
      className={cn(
        capsuleBase,
        focusRing,
        capsuleSize[size],
        disabled
          ? on
            ? capsuleState.selectedDisabled
            : capsuleState.disabled
          : on
            ? capsuleState.selected
            : capsuleState.rest,
        className,
      )}
    />
  );
}
