import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { cn } from "../../lib/cn";
import { useFieldContext } from "../field/Field";
import {
  controlSize,
  type ControlSize,
  type ControlVariant,
} from "../input/control-box";

export type SegmentedControlSize = ControlSize;
export type SegmentedControlVariant = ControlVariant;

type SegmentedContextValue = {
  name: string;
  value: string | undefined;
  select: (value: string) => void;
  size: SegmentedControlSize;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
};

const SegmentedContext = createContext<SegmentedContextValue | null>(null);

export type SegmentedControlProps = Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue"
> & {
  /** 受控的当前值 */
  value?: string;
  /** 非受控时的初始值 */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 表单字段名：选中的值会随表单提交。缺省自动生成 */
  name?: string;
  /** 32 / 40 / 56px 高，和输入框同三档 */
  size?: SegmentedControlSize;
  /**
   * 轨道的画法，和输入框相同：
   * - `sunken` 凹陷的底 + 一条底边线，默认；
   * - `outline` 四边描边，放在凹陷底色的区域里时用。
   */
  variant?: SegmentedControlVariant;
  disabled?: boolean;
  required?: boolean;
  /** 错误态。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
};

const track: Record<SegmentedControlVariant, string> = {
  sunken: "border-b-2 bg-surface-sunken",
  outline: "border bg-surface",
};

/**
 * 分段选择：两到五个值里选一个，选项并排摆在一条轨道里。
 * 语义是单选组——方向键换值，带 `name` 时随表单提交。里面只放 `Segment`。
 * 标签用 `Field` 包住它，或者自己传 `aria-label`。
 *
 * 切换的是下面显示哪一块内容时用 `Tabs`，不是它。
 */
export function SegmentedControl({
  value,
  defaultValue,
  onValueChange,
  name,
  size = "md",
  variant = "sunken",
  disabled: disabledProp,
  required: requiredProp,
  invalid: invalidProp,
  className,
  ...props
}: SegmentedControlProps) {
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
  const invalid = invalidProp ?? field?.invalid ?? false;
  const groupName = name ?? autoName;

  const context = useMemo<SegmentedContextValue>(
    () => ({
      name: groupName,
      value: current,
      select: setCurrent,
      size,
      disabled,
      required,
      invalid,
    }),
    [groupName, current, setCurrent, size, disabled, required, invalid],
  );

  return (
    <SegmentedContext value={context}>
      <div
        role="radiogroup"
        // 字段是 <fieldset> 时名称由 <legend> 给；否则指向字段的标签
        aria-labelledby={field && !field.group ? field.labelId : undefined}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        {...props}
        data-variant={variant}
        data-size={size}
        className={cn(
          // 各段等宽，按最宽的那一段定；比容器宽时一起收窄，文字截断
          "inline-grid max-w-full auto-cols-fr grid-flow-col p-0.5 text-ink",
          "transition-colors duration-(--duration-fast) ease-standard",
          track[variant],
          controlSize[size],
          // 和输入框一样靠边线说状态
          disabled
            ? "border-line"
            : invalid
              ? "border-danger"
              : "border-line-strong focus-within:border-ink",
          className,
        )}
      />
    </SegmentedContext>
  );
}

const segmentPadding: Record<SegmentedControlSize, string> = {
  sm: "gap-1.5 px-3 [&_svg]:size-3.5",
  md: "gap-2 px-4 [&_svg]:size-4",
  lg: "gap-2.5 px-6 [&_svg]:size-5",
};

type SegmentOwnProps = {
  value: string;
  /** 文字左边的图标。只有图标时要给 `aria-label` */
  icon?: ReactNode;
  disabled?: boolean;
  /** 这一段的可访问名称；不传就是里面的文字 */
  "aria-label"?: string;
  children?: ReactNode;
};

export type SegmentProps = SegmentOwnProps &
  Omit<ComponentProps<"label">, keyof SegmentOwnProps>;

/** 分段选择里的一段。`className` 给这一段的外壳。 */
export function Segment({
  value,
  icon,
  disabled: disabledProp,
  "aria-label": ariaLabel,
  className,
  children,
  ...props
}: SegmentProps) {
  const context = useContext(SegmentedContext);
  if (!context) {
    throw new Error("<Segment> 必须放在 <SegmentedControl> 里");
  }
  const checked = context.value === value;
  const disabled = disabledProp ?? context.disabled;

  return (
    <label
      {...props}
      data-selected={checked ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "relative flex min-w-0 items-center justify-center font-medium whitespace-nowrap select-none",
        "transition-colors duration-(--duration-fast) ease-standard",
        // 焦点环画在这一段上，并提到相邻段之上
        "has-focus-visible:z-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
        segmentPadding[context.size],
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        // 选中不加粗：加粗会让这一段变宽，整条跟着跳。靠的是填充反转
        checked
          ? disabled
            ? "bg-disabled text-on-disabled"
            : "bg-surface-inverse text-ink-inverse"
          : disabled
            ? "text-ink-disabled"
            : "text-ink-secondary hover:bg-ink/5 hover:text-ink",
        className,
      )}
    >
      <input
        type="radio"
        name={context.name}
        value={value}
        checked={checked}
        disabled={disabled}
        required={context.required}
        aria-label={ariaLabel}
        aria-invalid={context.invalid || undefined}
        onChange={() => context.select(value)}
        className="absolute inset-0 size-full cursor-[inherit] appearance-none outline-none"
      />
      {icon}
      {children !== undefined && (
        <span className="pointer-events-none min-w-0 truncate">{children}</span>
      )}
    </label>
  );
}
