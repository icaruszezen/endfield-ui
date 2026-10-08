import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { NavActionContext } from "../nav-action/NavAction";

export type TopBarProps = ComponentProps<"header"> & {
  /** 最左边的标志。本库不带标志，传你自己的 */
  brand?: ReactNode;
  /** 工具图标钮：几个 `IconButton` */
  tools?: ReactNode;
  /** 主行动：放一个 `NavAction` */
  action?: ReactNode;
  /** 最右边的菜单钮：放一个 `NavMenu`（它自己带着触发按钮） */
  menu?: ReactNode;
};

/**
 * 顶栏：窄屏上的主导航。从左到右是标志、空白、工具图标钮、主行动、菜单钮；
 * 栏目本身不排在这一条里，收进 `NavMenu`。
 *
 * 默认 `sticky` 贴在顶上。它只管排版，各格放什么由使用方给。
 */
export function TopBar({
  brand,
  tools,
  action,
  menu,
  className,
  children,
  ...props
}: TopBarProps) {
  return (
    <header
      {...props}
      className={cn(
        // 环境阴影在暗色页面上看不出来，所以另有一条边线
        "sticky top-0 z-(--z-nav) flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-4 text-ink shadow-lg",
        className,
      )}
    >
      {brand && <div className="flex min-w-0 items-center">{brand}</div>}
      <div className="min-w-0 flex-1">{children}</div>
      {tools && <div className="flex shrink-0 items-center gap-1">{tools}</div>}
      {action && <NavActionContext value="inline">{action}</NavActionContext>}
      {menu}
    </header>
  );
}
