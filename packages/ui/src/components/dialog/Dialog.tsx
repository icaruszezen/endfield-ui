import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  useRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { Close } from "../../icons/Close";
import { cn } from "../../lib/cn";
import { Texture } from "../texture/Texture";
import { firstFocusableIn } from "./initial-focus";
import {
  overlayBackdrop,
  overlayClose,
  overlayHeader,
  overlaySurface,
} from "./overlay-style";

export type DialogSize = "sm" | "md" | "lg";

type PopupProps = ComponentProps<typeof BaseDialog.Popup>;

export type DialogProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "className" | "style"
> & {
  /** 触发按钮。不传就用 `open` / `onOpenChange` 自己控制 */
  trigger?: ReactElement<Record<string, unknown>>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 标题，在深色标题带里居中。它也是弹窗的可访问名称 */
  title: ReactNode;
  /** 标题下的一段说明，会关联给读屏 */
  description?: ReactNode;
  /** 底部的行动区：按钮靠右，主要行动在最右 */
  footer?: ReactNode;
  /** 最大宽度 480 / 640 / 1040px，窄屏上通宽。默认 `md` */
  size?: DialogSize;
  /**
   * 需要用户明确回应的确认（破坏性操作）：角色是 `alertdialog`，点遮罩不关。
   * `Esc` 和关闭图标仍然可用。
   */
  alert?: boolean;
  /** 关闭图标的可访问名称 */
  closeLabel?: string;
  /** 打开时焦点落在哪。默认是内容区里第一个可聚焦的元素：第一个字段，或者行动区的第一个按钮 */
  initialFocus?: PopupProps["initialFocus"];
  /** 关闭后焦点回到哪。默认是触发按钮 */
  finalFocus?: PopupProps["finalFocus"];
  /** 给弹窗本身 */
  className?: string;
  children?: ReactNode;
};

const sizeClass: Record<DialogSize, string> = {
  sm: "max-w-[30rem]",
  md: "max-w-[40rem]",
  lg: "max-w-[65rem]",
};

/**
 * 弹窗：深色斜纹标题带 + 点阵底的内容区。打开时焦点移入并被限制在内，
 * 关闭后回到触发按钮；背景不可滚动、不可交互。不要弹窗套弹窗。
 */
export function Dialog({
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  footer,
  size = "md",
  alert = false,
  closeLabel = "关闭",
  initialFocus,
  finalFocus,
  className,
  children,
  ...props
}: DialogProps) {
  const { anchorRef, portalRef } = usePortalScope();
  const contentRef = useRef<HTMLDivElement>(null);
  // 两者除了 Root 与 Trigger 是同一批部件；确认弹窗的 Root 把角色和"点遮罩不关"定死了
  const Base = (alert ? BaseAlertDialog : BaseDialog) as typeof BaseDialog;

  return (
    <Base.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange && ((next) => onOpenChange(next))}
    >
      {trigger && <Base.Trigger ref={anchorRef} render={trigger} />}
      <Base.Portal ref={portalRef}>
        <Base.Backdrop className={overlayBackdrop} />
        <Base.Viewport className="fixed inset-0 z-(--z-overlay) flex items-center justify-center overflow-hidden p-4">
          <Base.Popup
            {...props}
            initialFocus={initialFocus ?? firstFocusableIn(contentRef)}
            finalFocus={finalFocus}
            data-size={size}
            className={cn(
              overlaySurface,
              "relative flex max-h-full min-h-0 w-full flex-col",
              "transition-[scale,opacity] duration-(--duration-base) ease-exit",
              "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
              sizeClass[size],
              className,
            )}
          >
            <div
              data-theme="dark"
              className={cn(overlayHeader, "min-h-16 justify-center px-12")}
            >
              {/* 全站的标题大多是粗体，弹窗标题是例外：深底白字本身已经够醒目 */}
              <Base.Title className="py-3 text-center text-xl font-normal wrap-anywhere">
                {title}
              </Base.Title>
              <Base.Close aria-label={closeLabel} className={overlayClose}>
                <Close size={24} />
              </Base.Close>
            </div>

            <div
              ref={contentRef}
              className="relative flex min-h-0 flex-auto flex-col"
            >
              <Texture />
              {/* 正文垫一层实色底，点阵只在四周露出一圈；内容过长时只有这一块滚动 */}
              <div className="relative min-h-0 flex-auto overflow-y-auto overscroll-contain p-4">
                <div className="bg-surface-raised p-5 wrap-anywhere">
                  {description && (
                    <Base.Description
                      className={cn(
                        "text-ink-secondary",
                        children !== undefined && "mb-4",
                      )}
                    >
                      {description}
                    </Base.Description>
                  )}
                  {children}
                </div>
              </div>
              {footer && (
                <div className="relative flex shrink-0 flex-wrap justify-end gap-3 border-t border-line bg-surface-raised px-5 py-4">
                  {footer}
                </div>
              )}
            </div>
          </Base.Popup>
        </Base.Viewport>
      </Base.Portal>
    </Base.Root>
  );
}

export type DialogCloseProps = {
  /** 点了就关掉弹窗的按钮，比如"取消" */
  children: ReactElement<Record<string, unknown>>;
};

/** 包住行动区里"点了就关"的按钮。弹窗和抽屉里都能用。 */
export function DialogClose({ children }: DialogCloseProps) {
  return <BaseDialog.Close render={children} />;
}
