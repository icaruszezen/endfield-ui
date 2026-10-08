import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { choiceControl, choiceLabel } from "../checkbox/choice-style";

type DualLabels =
  | { offLabel?: undefined; onLabel?: undefined }
  | {
      /** 双标签开关：关闭时的值，写在轨道左半（如 `2D`） */
      offLabel: ReactNode;
      /** 双标签开关：开启时的值，写在轨道右半（如 `3D`） */
      onLabel: ReactNode;
    };

export type SwitchProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  onCheckedChange?: (checked: boolean) => void;
  /** 右侧的文字标签。不传时必须自己给 `aria-label` */
  children?: ReactNode;
} & DualLabels;

const trackTransition =
  "transition-colors duration-(--duration-fast) ease-standard";
const dualLabel =
  "pointer-events-none relative min-w-9 px-3 text-center transition-colors duration-(--duration-fast) ease-standard peer-disabled:text-ink-disabled";

/**
 * 开关：胶囊轨道 + 圆形旋钮，立即生效的设置用它（需要"保存"才生效的用复选框）。
 * 原生 `<input type="checkbox" role="switch">`，受控用 `checked`、非受控用 `defaultChecked`。
 * `className` 给整行，其余属性与 `ref` 给 `<input>`。
 *
 * 两个值都要显示时（`2D` / `3D`）同时传 `offLabel` 与 `onLabel`：两个值并排写在轨道上，
 * 旋钮盖住当前的那一个。这时名称要写成"开 = 第二个值"的说法，如 `aria-label="三维视图"`。
 */
export function Switch({
  onCheckedChange,
  onChange,
  offLabel,
  onLabel,
  className,
  children,
  ...props
}: SwitchProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  const dual = offLabel !== undefined && onLabel !== undefined;

  const control = dual ? (
    // 两格等宽，按较宽的那个值定宽
    <span className="relative inline-grid h-8 grid-cols-2 items-center font-tech text-xs leading-none font-bold">
      <input
        {...props}
        type="checkbox"
        role="switch"
        onChange={handleChange}
        className={cn(
          // 两个值都是有效值，轨道不随开关变色：反转块的 80%，压在图像上时略微透出底下
          "peer absolute inset-0 size-full appearance-none rounded-full bg-surface-inverse/80 group-hover:bg-surface-inverse disabled:cursor-not-allowed disabled:bg-surface-muted",
          trackTransition,
          focusRing,
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-surface-muted",
          "transition-[translate] duration-(--duration-fast) ease-standard",
          "peer-checked:translate-x-full peer-disabled:bg-surface-raised",
        )}
      />
      {/* 旋钮上的值用墨色，轨道上的另一个值降到 70% */}
      <span
        aria-hidden="true"
        data-value="off"
        className={cn(dualLabel, "text-ink peer-checked:text-ink-inverse/70")}
      >
        {offLabel}
      </span>
      <span
        aria-hidden="true"
        data-value="on"
        className={cn(dualLabel, "text-ink-inverse/70 peer-checked:text-ink")}
      >
        {onLabel}
      </span>
    </span>
  ) : (
    <span className="relative inline-flex h-7 w-13">
      <input
        {...props}
        type="checkbox"
        role="switch"
        onChange={handleChange}
        className={cn(
          // 开：反转块作轨道。颜色只点在旋钮上，不是整条黄色轨道
          "peer h-7 w-13 appearance-none rounded-full bg-line-strong group-hover:bg-ink-tertiary checked:bg-surface-inverse disabled:cursor-not-allowed disabled:bg-surface-muted",
          trackTransition,
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
  );

  return (
    <label className={cn(choiceLabel, "gap-3", className)}>
      <span className={choiceControl}>{control}</span>
      {children !== undefined && <span className="min-w-0">{children}</span>}
    </label>
  );
}
