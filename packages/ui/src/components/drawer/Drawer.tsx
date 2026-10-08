import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import {
  useRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { Close } from "../../icons/Close";
import { cn } from "../../lib/cn";
import { firstFocusableIn } from "../dialog/initial-focus";
import {
  overlayBackdrop,
  overlayClose,
  overlayHeader,
  overlaySurface,
} from "../dialog/overlay-style";

export type DrawerSide = "right" | "left" | "bottom";
export type DrawerSize = "sm" | "md" | "lg";

type PopupProps = ComponentProps<typeof BaseDrawer.Popup>;

export type DrawerProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "className" | "style"
> & {
  /** 触发按钮。不传就用 `open` / `onOpenChange` 自己控制 */
  trigger?: ReactElement<Record<string, unknown>>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 标题，在深色标题带里左对齐。它也是抽屉的可访问名称 */
  title: ReactNode;
  /** 标题下的一段说明，会关联给读屏 */
  description?: ReactNode;
  /** 底部的行动区，不随内容滚动 */
  footer?: ReactNode;
  /**
   * 从哪一边滑入：
   * - `right` 详情、设置，默认；
   * - `left` 导航；
   * - `bottom` 移动端的操作菜单，带拖动把手。
   * 都可以朝来的方向划走。
   */
  side?: DrawerSide;
  /** 侧边抽屉的宽度 320 / 400 / 480px，窄屏上通宽。默认 `md`。底部抽屉不用 */
  size?: DrawerSize;
  /** 靠页面内容的一侧加一条行动色的细条 */
  accent?: boolean;
  /** 关闭图标的可访问名称 */
  closeLabel?: string;
  /** 打开时焦点落在哪。默认是内容区里第一个可聚焦的元素 */
  initialFocus?: PopupProps["initialFocus"];
  /** 关闭后焦点回到哪。默认是触发按钮 */
  finalFocus?: PopupProps["finalFocus"];
  /** 给抽屉本身 */
  className?: string;
  children?: ReactNode;
};

const swipeDirection = {
  right: "right",
  left: "left",
  bottom: "down",
} as const;

const viewportClass: Record<DrawerSide, string> = {
  right: "justify-end",
  left: "justify-start",
  bottom: "items-end",
};

const sizeClass: Record<DrawerSize, string> = {
  sm: "max-w-80",
  md: "max-w-100",
  lg: "max-w-120",
};

/*
 * 位移跟着手指走（--drawer-swipe-movement-*），进出场时整块移到屏幕外。
 * 拖动中不要过渡，否则抽屉会慢半拍。
 */
const motionClass: Record<DrawerSide, string> = {
  right:
    "translate-x-[var(--drawer-swipe-movement-x,0px)] data-ending-style:translate-x-full data-starting-style:translate-x-full",
  left: "translate-x-[var(--drawer-swipe-movement-x,0px)] data-ending-style:-translate-x-full data-starting-style:-translate-x-full",
  bottom:
    "translate-y-[var(--drawer-swipe-movement-y,0px)] data-ending-style:translate-y-full data-starting-style:translate-y-full",
};

const accentClass: Record<DrawerSide, string> = {
  right: "border-l-4 border-l-action",
  left: "border-r-4 border-r-action",
  bottom: "border-t-4 border-t-action",
};

/**
 * 抽屉：从屏幕一侧滑入的面板。在不离开当前页面的前提下查看、编辑一个条目，
 * 或者在窄屏上替代侧栏。焦点与背景的处理和弹窗相同。
 */
export function Drawer({
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  footer,
  side = "right",
  size = "md",
  accent = false,
  closeLabel = "关闭",
  initialFocus,
  finalFocus,
  className,
  children,
  ...props
}: DrawerProps) {
  const { anchorRef, portalRef } = usePortalScope();
  const contentRef = useRef<HTMLDivElement>(null);
  const sheet = side === "bottom";

  return (
    <BaseDrawer.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange && ((next) => onOpenChange(next))}
      swipeDirection={swipeDirection[side]}
    >
      {trigger && <BaseDrawer.Trigger ref={anchorRef} render={trigger} />}
      <BaseDrawer.Portal ref={portalRef}>
        <BaseDrawer.Backdrop
          className={cn(
            overlayBackdrop,
            // 往外划的时候遮罩跟着变淡
            "opacity-[calc(1-var(--drawer-swipe-progress,0))] data-swiping:duration-0",
          )}
        />
        <BaseDrawer.Viewport
          className={cn(
            "fixed inset-0 z-(--z-overlay) flex overflow-hidden",
            viewportClass[side],
          )}
        >
          <BaseDrawer.Popup
            {...props}
            initialFocus={initialFocus ?? firstFocusableIn(contentRef)}
            finalFocus={finalFocus}
            data-side={side}
            className={cn(
              overlaySurface,
              "flex min-h-0 w-full flex-col",
              sheet ? "max-h-[85dvh]" : ["h-full", sizeClass[size]],
              "transition-[translate] duration-(--duration-base) ease-exit data-swiping:duration-0 data-swiping:select-none",
              motionClass[side],
              accent && accentClass[side],
              className,
            )}
          >
            <div
              data-theme="dark"
              className={cn(
                overlayHeader,
                "min-h-12 pr-12 pl-4",
                sheet && "pt-2",
              )}
            >
              {sheet && (
                // 拖动把手
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-1/2 h-1 w-8 -translate-x-1/2 bg-line-strong"
                />
              )}
              <BaseDrawer.Title className="py-2.5 text-lg font-normal wrap-anywhere">
                {title}
              </BaseDrawer.Title>
              <BaseDrawer.Close
                aria-label={closeLabel}
                className={overlayClose}
              >
                <Close size={24} />
              </BaseDrawer.Close>
            </div>

            <div ref={contentRef} className="flex min-h-0 flex-auto flex-col">
              <BaseDrawer.Content className="min-h-0 flex-auto overflow-y-auto overscroll-contain p-4 wrap-anywhere">
                {description && (
                  <BaseDrawer.Description
                    className={cn(
                      "text-ink-secondary",
                      children !== undefined && "mb-4",
                    )}
                  >
                    {description}
                  </BaseDrawer.Description>
                )}
                {children}
              </BaseDrawer.Content>

              {footer && (
                <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-line px-4 py-3">
                  {footer}
                </div>
              )}
            </div>
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  );
}
