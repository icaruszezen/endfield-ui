import type { ComponentProps, ComponentType, ReactNode } from "react";
import { usePresence } from "../../hooks/usePresence";
import { Close } from "../../icons/Close";
import type { IconProps } from "../../icons/createIcon";
import { StatusDanger } from "../../icons/StatusDanger";
import { StatusInfo } from "../../icons/StatusInfo";
import { StatusSuccess } from "../../icons/StatusSuccess";
import { StatusWarning } from "../../icons/StatusWarning";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { mergeRefs } from "../../lib/merge-refs";

export type AlertTone = "info" | "success" | "warning" | "danger";

export type AlertProps = Omit<ComponentProps<"div">, "title"> & {
  /** 色调只点在左缘色条和图标上，底色保持中性。默认 `info` */
  tone?: AlertTone;
  /** 加粗的一行标题，可省 */
  title?: ReactNode;
  /** 右侧的一个操作，通常是 `text` 按钮 */
  action?: ReactNode;
  /**
   * 传了就出现关闭图标。它只负责通知：显示与否由使用方决定——
   * 要收起的过程，把 `open` 交给提示条；直接不渲染它就是立刻消失
   */
  onClose?: () => void;
  /** 置为 `false` 时先收起、淡出，再卸载。默认 `true` */
  open?: boolean;
  /** 收完、已经卸载之后触发 */
  onExited?: () => void;
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

/*
 * 收起：量一次自己的高度，再把高度、上下的内边距和边线、外边距一起过渡到"它不在了"的样子。
 * 父容器是纵向排的（flex 的列、grid）时，它一走还少一个行间距：下外边距收到负的行间距，
 * 卸载的那一刻后面的内容才不会再跳一下。
 * 不多包一层来做：`className` 是给带边线的这一层的。返回的函数把摆上去的撤掉
 */
function collapseOut(node: HTMLElement) {
  const { style } = node;
  const before = style.cssText;

  let gap = 0;
  if (node.parentElement) {
    const layout = getComputedStyle(node.parentElement);
    const stacked =
      layout.display.includes("grid") ||
      (layout.display.includes("flex") &&
        layout.flexDirection.startsWith("column"));
    if (stacked) gap = Number.parseFloat(layout.rowGap) || 0;
  }

  style.height = `${node.getBoundingClientRect().height}px`;
  // 先把起点落下去，下面这几样才是"变过去"的
  node.getBoundingClientRect();
  style.height = "0px";
  style.minHeight = "0px";
  style.paddingBlock = "0px";
  style.borderBlockWidth = "0px";
  style.marginTop = "0px";
  style.marginBottom = `${-gap}px`;
  style.opacity = "0";

  return () => {
    style.cssText = before;
  };
}

/** 页面内的一条常驻消息。需要用户处理的重要信息用它，不用会消失的轻提示。 */
export function Alert({
  tone = "info",
  title,
  action,
  onClose,
  open = true,
  onExited,
  closeLabel = "关闭",
  icon,
  className,
  ref,
  children,
  ...props
}: AlertProps) {
  const {
    ref: rootRef,
    mounted,
    leaving,
  } = usePresence<HTMLDivElement>(open, { onLeave: collapseOut, onExited });
  if (!mounted) return null;

  const Icon = toneIcon[tone];
  const graphic = icon === undefined ? <Icon size={20} /> : icon;

  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      {...props}
      ref={mergeRefs(rootRef, ref)}
      data-tone={tone}
      // 正在收起的提示条点不到、Tab 不进去
      inert={leaving}
      className={cn(
        "flex items-start gap-3 border border-l-4 border-line bg-surface-raised py-3 pr-3 pl-3 text-sm text-ink",
        toneBar[tone],
        leaving && [
          "pointer-events-none overflow-hidden",
          "transition-[height,padding,margin,border-width,opacity] duration-(--duration-fast) ease-standard",
        ],
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
