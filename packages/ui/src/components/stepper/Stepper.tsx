import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { Minus } from "../../icons/Minus";
import { Plus } from "../../icons/Plus";
import { cn } from "../../lib/cn";
import { focusRingWithin } from "../../lib/focus-ring";
import { useFieldControl } from "../field/Field";

export type StepperSize = "sm" | "md" | "lg";

export type StepperProps = Omit<
  ComponentProps<"input">,
  | "type"
  | "size"
  | "value"
  | "defaultValue"
  | "onChange"
  | "min"
  | "max"
  | "step"
> & {
  /** 受控的当前值 */
  value?: number;
  /** 非受控时的初始值，缺省取 `min`，没有 `min` 则为 0 */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** 每一步的增量，默认 1；可以是小数 */
  step?: number;
  /** 32 / 40 / 56px 高 */
  size?: StepperSize;
  /** 错误态：数字下方出现一条红线。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
  /** 两端按钮的可访问名称 */
  decrementLabel?: string;
  incrementLabel?: string;
};

const boxSize: Record<StepperSize, string> = {
  sm: "h-8 text-sm",
  md: "h-10 text-base",
  lg: "h-14 text-lg",
};

const buttonSize: Record<StepperSize, string> = {
  sm: "w-8",
  md: "w-10",
  lg: "w-14",
};

const fieldSize: Record<StepperSize, string> = {
  sm: "w-12",
  md: "w-14",
  lg: "w-20",
};

const iconSize: Record<StepperSize, number> = { sm: 14, md: 16, lg: 20 };

/** 按住多久开始连续加减，以及之后每一步的间隔 */
const HOLD_DELAY = 400;
const HOLD_INTERVAL = 80;

function decimalsOf(value: number) {
  const text = String(value);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * 步进器：`−` 钮 + 数字 + `+` 钮，三段紧贴。数字可以直接输入，
 * 也可以用 ↑ ↓（一步）、PageUp / PageDown（十步）、Home / End（上下限）。
 * `className` 给外框，其余属性与 `ref` 给中间的 `<input>`。
 */
export function Stepper({
  value: valueProp,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  size = "md",
  invalid: invalidProp,
  decrementLabel = "减少",
  incrementLabel = "增加",
  id: idProp,
  disabled: disabledProp,
  required: requiredProp,
  readOnly = false,
  "aria-describedby": describedByProp,
  onKeyDown,
  onBlur,
  className,
  ...props
}: StepperProps) {
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });

  // 小数步长会带出 0.1 + 0.2 这样的浮点尾数，统一按步长的小数位数取整
  const precision = Math.max(
    decimalsOf(step),
    decimalsOf(min ?? 0),
    decimalsOf(max ?? 0),
  );
  const normalize = (next: number) => {
    const clamped = Math.min(
      Math.max(next, min ?? -Infinity),
      max ?? Infinity,
    );
    return Number(clamped.toFixed(precision));
  };

  const [value, setValue] = useControllableState<number>({
    value: valueProp,
    defaultValue: defaultValue ?? normalize(0),
    onChange: onValueChange,
  });

  // 输入到一半的文字：不为 null 时输入框显示它，失焦或回车时才变成数值
  const [draft, setDraft] = useState<string | null>(null);

  const atMin = min !== undefined && value <= min;
  const atMax = max !== undefined && value >= max;
  const locked = disabled || readOnly;

  /** 加减一段；值真的变了才返回 true，按住连续加减靠它在到头时停表 */
  const stepBy = (delta: number) => {
    const typed = draft === null || draft.trim() === "" ? NaN : Number(draft);
    const base = Number.isFinite(typed) ? typed : value;
    const next = normalize(base + delta);
    setDraft(null);
    if (next === value) return false;
    setValue(next);
    return true;
  };

  const commitDraft = () => {
    if (draft === null) return;
    const typed = draft.trim() === "" ? NaN : Number(draft);
    setDraft(null);
    // 清空或只敲了一个负号：还原成原来的值
    if (!Number.isFinite(typed)) return;
    setValue(normalize(typed));
  };

  // 定时器里要用到最新的值和回调
  const stepRef = useRef(stepBy);
  useEffect(() => {
    stepRef.current = stepBy;
  });

  const holdRef = useRef<{ delay?: number; repeat?: number }>({});
  const release = () => {
    window.clearTimeout(holdRef.current.delay);
    window.clearInterval(holdRef.current.repeat);
    holdRef.current = {};
  };
  useEffect(() => release, []);

  const press = (event: PointerEvent<HTMLButtonElement>, delta: number) => {
    // 只认主键；触屏和笔没有 button 的区分
    if (event.button > 0) return;
    release();
    if (!stepRef.current(delta)) return;
    holdRef.current.delay = window.setTimeout(() => {
      holdRef.current.repeat = window.setInterval(() => {
        if (!stepRef.current(delta)) release();
      }, HOLD_INTERVAL);
    }, HOLD_DELAY);
  };

  // 指针按下时已经走过一步；click 只留给键盘和读屏（它们触发的 click 没有次数）
  const click = (event: MouseEvent<HTMLButtonElement>, delta: number) => {
    if (event.detail === 0) stepBy(delta);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    // 只收数字、负号和小数点，其余按键不进输入框
    if (/^-?\d*\.?\d*$/.test(raw)) setDraft(raw);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || locked) return;

    switch (event.key) {
      case "ArrowUp":
        stepBy(step);
        break;
      case "ArrowDown":
        stepBy(-step);
        break;
      case "PageUp":
        stepBy(step * 10);
        break;
      case "PageDown":
        stepBy(-step * 10);
        break;
      case "Home":
        if (min === undefined) return;
        setDraft(null);
        setValue(min);
        break;
      case "End":
        if (max === undefined) return;
        setDraft(null);
        setValue(max);
        break;
      case "Enter":
        // 不拦回车：所在的表单照常提交，只是先把输入到一半的数落定
        commitDraft();
        return;
      default:
        return;
    }
    event.preventDefault();
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    commitDraft();
  };

  const buttonClass = (inactive: boolean) =>
    cn(
      "flex shrink-0 items-center justify-center select-none",
      "transition-colors duration-(--duration-fast) ease-standard",
      buttonSize[size],
      inactive
        ? "cursor-not-allowed bg-disabled text-on-disabled"
        : "bg-control text-on-control hover:bg-control-hover active:bg-control-pressed",
    );

  return (
    <div
      data-size={size}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        "inline-flex items-stretch",
        focusRingWithin,
        boxSize[size],
        className,
      )}
    >
      <button
        type="button"
        // 键盘用户在输入框里按方向键，按钮不占 Tab 顺序
        tabIndex={-1}
        aria-label={decrementLabel}
        disabled={locked || atMin}
        onPointerDown={(event) => press(event, -step)}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onClick={(event) => click(event, -step)}
        className={buttonClass(locked || atMin)}
      >
        <Minus size={iconSize[size]} />
      </button>
      <input
        {...props}
        id={id}
        type="text"
        role="spinbutton"
        inputMode={precision > 0 ? "decimal" : "numeric"}
        autoComplete="off"
        value={draft ?? String(value)}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-invalid={invalid || undefined}
        aria-describedby={field["aria-describedby"]}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "min-w-0 flex-1 border-y-2 border-transparent bg-surface-sunken text-center font-tech font-bold tabular-nums outline-none",
          "disabled:cursor-not-allowed",
          fieldSize[size],
          disabled ? "text-ink-disabled" : "text-ink",
          invalid && !disabled && "border-b-danger",
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={incrementLabel}
        disabled={locked || atMax}
        onPointerDown={(event) => press(event, step)}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onClick={(event) => click(event, step)}
        className={buttonClass(locked || atMax)}
      >
        <Plus size={iconSize[size]} />
      </button>
    </div>
  );
}
