import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { choiceControl, choiceLabel } from "../checkbox/choice-style";

export type SwitchProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  onCheckedChange?: (checked: boolean) => void;
  /** 右侧的文字标签。不传时必须自己给 `aria-label` */
  children?: ReactNode;
};

/**
 * 开关：胶囊轨道 + 圆形旋钮，立即生效的设置用它（需要"保存"才生效的用复选框）。
 * 原生 `<input type="checkbox" role="switch">`，受控用 `checked`、非受控用 `defaultChecked`。
 * `className` 给整行，其余属性与 `ref` 给 `<input>`。
 */
export function Switch({
  onCheckedChange,
  onChange,
  className,
  children,
  ...props
}: SwitchProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <label className={cn(choiceLabel, "gap-3", className)}>
      <span className={choiceControl}>
        <span className="relative inline-flex h-7 w-13">
          <input
            {...props}
            type="checkbox"
            role="switch"
            onChange={handleChange}
            className={cn(
              // 开：反转块作轨道。颜色只点在旋钮上，不是整条黄色轨道
              "peer h-7 w-13 appearance-none rounded-full bg-line-strong group-hover:bg-ink-tertiary checked:bg-surface-inverse disabled:cursor-not-allowed disabled:bg-surface-muted",
              "transition-colors duration-(--duration-fast) ease-standard",
              focusRing,
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-surface-raised",
              "transition-[translate,background-color] duration-(--duration-fast) ease-standard",
              "peer-checked:translate-x-6 peer-checked:bg-accent-ink-inverse peer-disabled:bg-ink-disabled",
            )}
          />
        </span>
      </span>
      {children !== undefined && <span className="min-w-0">{children}</span>}
    </label>
  );
}
