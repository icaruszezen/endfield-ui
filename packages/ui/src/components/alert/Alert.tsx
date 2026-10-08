import type { ComponentProps, ComponentType, ReactNode } from "react";
import { Close } from "../../icons/Close";
import type { IconProps } from "../../icons/createIcon";
import { StatusDanger } from "../../icons/StatusDanger";
import { StatusInfo } from "../../icons/StatusInfo";
import { StatusSuccess } from "../../icons/StatusSuccess";
import { StatusWarning } from "../../icons/StatusWarning";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";

export type AlertTone = "info" | "success" | "warning" | "danger";

export type AlertProps = Omit<ComponentProps<"div">, "title"> & {
  /** 色调只点在左缘色条和图标上，底色保持中性。默认 `info` */
  tone?: AlertTone;
  /** 加粗的一行标题，可省 */
  title?: ReactNode;
  /** 右侧的一个操作，通常是 `text` 按钮 */
  action?: ReactNode;
  /** 传了就出现关闭图标。提示条自己不隐藏，由使用方决定 */
  onClose?: () => void;
  /** 关闭图标的可访问名称 */
  closeLabel?: string;
  /** 替换默认图标；传 `null` 去掉 */
  icon?: ReactNode;
};

/* 四种色调用四种不同外形的图标：方框、圆、三角、菱形 */
const toneIcon: Record<AlertTone, ComponentType<IconProps>> = {
  info: StatusInfo,
  success: StatusSuccess,
  warning: StatusWarning,
  danger: StatusDanger,
};

const toneBar: Record<AlertTone, string> = {
  info: "border-l-info",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-danger",
};

const toneText: Record<AlertTone, string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/** 页面内的一条常驻消息。需要用户处理的重要信息用它，不用会消失的轻提示。 */
export function Alert({
  tone = "info",
  title,
  action,
  onClose,
  closeLabel = "关闭",
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  const Icon = toneIcon[tone];
  const graphic = icon === undefined ? <Icon size={20} /> : icon;

  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      {...props}
      data-tone={tone}
      className={cn(
        "flex items-start gap-3 border border-l-4 border-line bg-surface-raised py-3 pr-3 pl-3 text-sm text-ink",
        toneBar[tone],
        className,
      )}
    >
      {graphic !== null && (
        <span aria-hidden="true" className={cn("shrink-0", toneText[tone])}>
          {graphic}
        </span>
      )}
      <div className="min-w-0 flex-1 wrap-anywhere">
        {title && <p className="font-medium">{title}</p>}
        {children && (
          <div className={cn(title && "mt-0.5 text-ink-secondary")}>
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className={cn(
            "-my-1.5 -mr-1 inline-flex size-8 shrink-0 items-center justify-center text-ink-secondary hover:bg-ink/5 hover:text-ink active:bg-ink/10",
            "transition-colors duration-(--duration-fast) ease-standard",
            focusRing,
          )}
        >
          <Close size={16} />
        </button>
      )}
    </div>
  );
}
