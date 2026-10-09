import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { cn } from "../../lib/cn";
import {
  popoverDescription,
  popoverPanel,
  popoverTitle,
} from "../popover/panel-style";

export type HoverCardSide = "top" | "bottom" | "left" | "right";
export type HoverCardAlign = "start" | "center" | "end";

export type HoverCardProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "className" | "style"
> & {
  /** 触发元素：一个链接（`<a>`、带 `href` 的按钮、路由库的链接组件） */
  trigger: ReactElement<Record<string, unknown>>;
  /** 卡片里的标题 */
  title?: ReactNode;
  /** 标题下的一行说明 */
  description?: ReactNode;
  /** 卡片出现在链接的哪一侧，放不下时自动翻到对面。默认 `bottom` */
  side?: HoverCardSide;
  /** 和链接的哪一边对齐。默认 `start` */
  align?: HoverCardAlign;
  /** 指针停住多久后出现，毫秒，默认 600。键盘聚焦时同样要等 */
  delay?: number;
  /** 指针离开多久后消失，毫秒，默认 300：够把指针移进卡片里 */
  closeDelay?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 给卡片 */
  className?: string;
  children?: ReactNode;
};

/**
 * 悬浮卡：指针停在一个链接上时，在旁边预览它的去处。面板和气泡卡片是同一块。
 *
 * 触屏上不出现，读屏也不会读到它：里面只放"点进去也看得到"的内容，
 * 不放只有这里才有的信息和操作。要操作的用 `Popover`，一句说明用 `Tooltip`。
 */
export function HoverCard({
  trigger,
  title,
  description,
  side = "bottom",
  align = "start",
  delay = 600,
  closeDelay = 300,
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
  ...props
}: HoverCardProps) {
  const { anchorRef, portalRef } = usePortalScope();

  return (
    <BasePreviewCard.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange && ((next) => onOpenChange(next))}
    >
      <BasePreviewCard.Trigger
        ref={anchorRef}
        render={trigger}
        delay={delay}
        closeDelay={closeDelay}
      />
      <BasePreviewCard.Portal ref={portalRef}>
        <BasePreviewCard.Positioner
          side={side}
          align={align}
          sideOffset={4}
          className="z-(--z-overlay) outline-none"
        >
          <BasePreviewCard.Popup
            {...props}
            data-hover-card=""
            className={cn(popoverPanel, className)}
          >
            {(title || description) && (
              <div className="flex flex-col gap-1">
                {title && <p className={popoverTitle}>{title}</p>}
                {description && (
                  <p className={popoverDescription}>{description}</p>
                )}
              </div>
            )}
            {children}
          </BasePreviewCard.Popup>
        </BasePreviewCard.Positioner>
      </BasePreviewCard.Portal>
    </BasePreviewCard.Root>
  );
}
