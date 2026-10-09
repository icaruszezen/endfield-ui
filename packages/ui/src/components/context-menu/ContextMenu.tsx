import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ReactElement, ReactNode } from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { cn } from "../../lib/cn";
import {
  MenuVariantContext,
  menuPanel,
  type MenuVariant,
} from "../dropdown-menu/menu-style";

export type ContextMenuVariant = MenuVariant;

export type ContextMenuProps = {
  /**
   * 菜单里的内容：`DropdownMenuItem`、`DropdownMenuCheckboxItem`、
   * `DropdownMenuGroup`、`DropdownMenuSeparator`、`DropdownMenuSub`
   */
  menu: ReactNode;
  /** 被右键的区域：一个能接收 `ref` 与事件的元素 */
  children: ReactElement<Record<string, unknown>>;
  /**
   * - `plain` 跟随主题的面板，默认；
   * - `strong` 固定的深色面板。
   */
  variant?: ContextMenuVariant;
  onOpenChange?: (open: boolean) => void;
  /** 不再拦右键：回到浏览器自己的菜单 */
  disabled?: boolean;
  /** 给面板 */
  className?: string;
};

/**
 * 右键菜单：在一块区域上点右键（或按菜单键、触屏长按）时出现在指针处的下拉菜单。
 * 它只是捷径——里面的操作在页面上必须另有入口。
 */
export function ContextMenu({
  menu,
  children,
  variant = "plain",
  onOpenChange,
  disabled,
  className,
}: ContextMenuProps) {
  const { anchorRef, portalRef } = usePortalScope();

  return (
    <BaseContextMenu.Root
      disabled={disabled}
      onOpenChange={onOpenChange && ((next) => onOpenChange(next))}
    >
      <BaseContextMenu.Trigger ref={anchorRef} render={children} />
      <BaseContextMenu.Portal ref={portalRef}>
        <BaseContextMenu.Positioner className="z-(--z-overlay) outline-none">
          <BaseContextMenu.Popup
            data-theme={variant === "strong" ? "dark" : undefined}
            data-variant={variant}
            className={cn(
              menuPanel,
              "max-h-(--available-height) overflow-y-auto overscroll-contain",
              className,
            )}
          >
            <MenuVariantContext value={variant}>{menu}</MenuVariantContext>
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  );
}
