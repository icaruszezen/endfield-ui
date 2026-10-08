import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Check } from "../../icons/Check";
import { Minus } from "../../icons/Minus";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { mergeRefs } from "../../lib/merge-refs";
import {
  choiceBox,
  choiceControl,
  choiceFrame,
  choiceLabel,
  choiceMark,
} from "./choice-style";

export type CheckboxProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  /** 半选：一组子项只选了一部分。显示为短横，读屏读作"部分选中" */
  indeterminate?: boolean;
  /** 错误态：描边变红 */
  invalid?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** 右侧的文字标签。不传时必须自己给 `aria-label` */
  children?: ReactNode;
};

/**
 * 复选框。原生 `<input type="checkbox">`，受控用 `checked`、非受控用 `defaultChecked`。
 * `className` 给整行，其余属性与 `ref` 给 `<input>`。
 */
export function Checkbox({
  indeterminate = false,
  invalid = false,
  onCheckedChange,
  onChange,
  className,
  children,
  ref,
  ...props
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // indeterminate 只能通过 DOM 属性设置，没有对应的 HTML 特性
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <label className={cn(choiceLabel, className)}>
      <span className={choiceControl}>
        <span className={choiceFrame}>
          <input
            {...props}
            ref={mergeRefs(inputRef, ref)}
            type="checkbox"
            aria-invalid={invalid || undefined}
            onChange={handleChange}
            className={cn(
              choiceBox,
              // 半选只属于复选框：一组单选都没选时也会命中 :indeterminate，
              // 所以这两个类不能放进与单选共用的 choiceBox
              "indeterminate:border-surface-inverse indeterminate:bg-surface-inverse",
              focusRing,
            )}
          />
          <Check
            size={14}
            strokeWidth={3}
            className={cn(
              choiceMark,
              // 菱形方案下"已选"就是实心菱形，不画对勾
              "peer-checked:opacity-100 peer-indeterminate:opacity-0 choice-diamond:hidden",
            )}
          />
          <Minus
            size={14}
            strokeWidth={3}
            className={cn(choiceMark, "peer-indeterminate:opacity-100")}
          />
        </span>
      </span>
      {children !== undefined && <span className="min-w-0">{children}</span>}
    </label>
  );
}
