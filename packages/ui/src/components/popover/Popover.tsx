import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { cn } from "../../lib/cn";
import { menuPanel } from "../dropdown-menu/menu-style";

export type PopoverSide = "top" | "bottom" | "left" | "right";
export type PopoverAlign = "start" | "center" | "end";

export type PopoverProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "className" | "style"
> & {
  /** 触发按钮 */
  trigger: ReactElement<Record<string, unknown>>;
  /** 标题。有它时它就是面板的可访问名称；没有时自己传 `aria-label` */
  title?: ReactNode;
  /** 标题下的一行说明，会关联给读屏 */
  description?: ReactNode;
  /** 面板出现在触发按钮的哪一侧，放不下时自动翻到对面。默认 `bottom` */
  side?: PopoverSide;
  /** 和触发按钮的哪一边对齐。默认 `start` */
  align?: PopoverAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 给面板 */
  className?: string;
  children?: ReactNode;
};

/**
 * 气泡卡片：点击触发、里面可以操作的一小块面板。不是模态——页面其余部分照常可用，
 * 点别处、按 `Esc`、焦点移出去都会关。只是一句说明用 `Tooltip`，
 * 必须做完才能继续的用 `Dialog`。
 */
export function Popover({
  trigger,
  title,
  description,
  side = "bottom",
  align = "start",
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
  ...props
}: PopoverProps) {
  const { anchorRef, portalRef } = usePortalScope();

  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange && ((next) => onOpenChange(next))}
    >
      <BasePopover.Trigger ref={anchorRef} render={trigger} />
      <BasePopover.Portal ref={portalRef}>
        <BasePopover.Positioner
          side={side}
          align={align}
          sideOffset={4}
          className="z-(--z-overlay) outline-none"
        >
          <BasePopover.Popup
            {...props}
            className={cn(
              menuPanel,
              // 面板和下拉菜单是同一份画法，只把上下 4px 的内边距换成四周 16px
              "flex w-max max-w-[min(20rem,var(--available-width))] flex-col gap-3 p-4 text-sm wrap-anywhere",
              className,
            )}
          >
            {(title || description) && (
              <div className="flex flex-col gap-1">
                {title && (
                  <BasePopover.Title className="text-base font-bold">
                    {title}
                  </BasePopover.Title>
                )}
                {description && (
                  <BasePopover.Description className="text-ink-secondary">
                    {description}
                  </BasePopover.Description>
                )}
              </div>
            )}
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

export type PopoverCloseProps = {
  /** 点了就关掉面板的按钮，比如"完成" */
  children: ReactElement<Record<string, unknown>>;
};

/** 包住面板里"点了就关"的按钮。 */
export function PopoverClose({ children }: PopoverCloseProps) {
  return <BasePopover.Close render={children} />;
}
