import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type ResourceChipSize = "sm" | "md";

export type ResourceChipProps = Omit<ComponentProps<"span">, "children"> & {
  /** 资源的图标，放进左端的圆形底托。本库不带资源图标，由使用方提供 */
  icon?: ReactNode;
  /** 数量，等宽数字 */
  children: ReactNode;
  /** 给读屏的完整说明，如"燃料 1,280"。提供后数字本身对辅助技术隐藏 */
  label?: string;
  size?: ResourceChipSize;
};

const sizeClass: Record<ResourceChipSize, string> = {
  sm: "h-6 gap-1 pr-2.5 text-xs",
  md: "h-7 gap-1.5 pr-3 text-sm",
};

const iconPadding: Record<ResourceChipSize, string> = {
  sm: "pl-0.5",
  md: "pl-1",
};

const plainPadding: Record<ResourceChipSize, string> = {
  sm: "pl-2.5",
  md: "pl-3",
};

/** 资源胶囊：货币、材料的当前数量——会变的状态，所以是胶囊。 */
export function ResourceChip({
  icon,
  label,
  size = "md",
  className,
  children,
  ...props
}: ResourceChipProps) {
  return (
    <span
      {...props}
      className={cn(
        // 有意不随主题翻转：control 系列在两个主题下取值相同
        "inline-flex shrink-0 items-center rounded-full bg-control font-tech leading-none font-bold whitespace-nowrap text-on-control tabular-nums",
        sizeClass[size],
        icon ? iconPadding[size] : plainPadding[size],
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-on-control/15 [&_svg]:size-3"
        >
          {icon}
        </span>
      )}
      <span aria-hidden={label ? "true" : undefined}>{children}</span>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
