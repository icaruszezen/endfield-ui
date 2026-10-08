import { Menu as BaseMenu } from "@base-ui/react/menu";
import {
  useContext,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { cn } from "../../lib/cn";
import {
  MenuVariantContext,
  menuGroupLabel,
  menuItem,
  menuItemCurrent,
  menuItemHover,
  menuPanel,
  menuSeparator,
  type MenuVariant,
} from "./menu-style";

export type DropdownMenuVariant = MenuVariant;
export type DropdownMenuSide = "top" | "bottom" | "left" | "right";
export type DropdownMenuAlign = "start" | "center" | "end";

export type DropdownMenuProps = {
  /** 触发按钮 */
  trigger: ReactElement<Record<string, unknown>>;
  /**
   * - `plain` 跟随主题的面板，默认；
   * - `strong` 固定的深色面板，当前项整行黄底墨字。
   */
  variant?: DropdownMenuVariant;
  /** 面板出现在触发按钮的哪一侧，放不下时自动翻到对面。默认 `bottom` */
  side?: DropdownMenuSide;
  /** 和触发按钮的哪一边对齐。默认 `start` */
  align?: DropdownMenuAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 给面板 */
  className?: string;
  /** `DropdownMenuItem`、`DropdownMenuGroup`、`DropdownMenuSeparator`、`DropdownMenuRadioGroup` */
  children: ReactNode;
};

/**
 * 点击触发的一组操作或选项。方向键移动、回车选择、`Esc` 关闭、按首字母跳转。
 * 危险项放在最后并和其他项隔开。
 */
export function DropdownMenu({
  trigger,
  variant = "plain",
  side = "bottom",
  align = "start",
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
}: DropdownMenuProps) {
  const { anchorRef, portalRef } = usePortalScope();

  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange && ((next) => onOpenChange(next))}
    >
      <BaseMenu.Trigger ref={anchorRef} render={trigger} />
      <BaseMenu.Portal ref={portalRef}>
        <BaseMenu.Positioner
          side={side}
          align={align}
          sideOffset={4}
          className="z-(--z-overlay) outline-none"
        >
          <BaseMenu.Popup
            data-theme={variant === "strong" ? "dark" : undefined}
            data-variant={variant}
            className={cn(
              menuPanel,
              "max-h-(--available-height) overflow-y-auto overscroll-contain",
              className,
            )}
          >
            <MenuVariantContext value={variant}>{children}</MenuVariantContext>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export type DropdownMenuItemTone = "neutral" | "danger";

type ItemOwnProps = {
  /** `danger` 用于删除一类的操作：文字变红，放在最后并和其他项隔开 */
  tone?: DropdownMenuItemTone;
  /** 文字左侧的图标 */
  iconStart?: ReactNode;
  /** 行尾的补充：快捷键、计数 */
  end?: ReactNode;
  disabled?: boolean;
  /** 点了之后是否关掉菜单。操作项默认关，链接项默认不关 */
  closeOnClick?: boolean;
  /** 传了就渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

export type DropdownMenuItemProps = ItemOwnProps &
  Omit<ComponentProps<"div">, keyof ItemOwnProps | "id" | "style">;

function itemContent(
  iconStart: ReactNode,
  children: ReactNode,
  end: ReactNode,
) {
  return (
    <>
      {iconStart && (
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center [&_svg]:size-4"
        >
          {iconStart}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {end && (
        <span className="ml-4 flex shrink-0 items-center text-xs text-ink-secondary">
          {end}
        </span>
      )}
    </>
  );
}

/** 菜单里的一个操作；传 `href` 就是一个链接。 */
export function DropdownMenuItem({
  tone = "neutral",
  iconStart,
  end,
  disabled,
  closeOnClick,
  href,
  target,
  rel,
  onClick,
  className,
  children,
  ...props
}: DropdownMenuItemProps) {
  const classes = cn(
    menuItem,
    menuItemHover,
    tone === "danger" && "text-danger",
    className,
  );
  const content = itemContent(iconStart, children, end);

  if (href !== undefined) {
    return (
      <BaseMenu.LinkItem
        href={href}
        target={target}
        rel={rel}
        closeOnClick={closeOnClick}
        onClick={onClick}
        data-tone={tone}
        className={classes}
      >
        {content}
      </BaseMenu.LinkItem>
    );
  }

  return (
    <BaseMenu.Item
      {...props}
      disabled={disabled}
      closeOnClick={closeOnClick}
      onClick={onClick}
      data-tone={tone}
      className={classes}
    >
      {content}
    </BaseMenu.Item>
  );
}

export type DropdownMenuGroupProps = Omit<ComponentProps<"div">, "style"> & {
  /** 分组的小标题 */
  label?: ReactNode;
};

export function DropdownMenuGroup({
  label,
  children,
  ...props
}: DropdownMenuGroupProps) {
  return (
    <BaseMenu.Group {...props}>
      {label && (
        <BaseMenu.GroupLabel className={menuGroupLabel}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  );
}

export type DropdownMenuSeparatorProps = Omit<ComponentProps<"div">, "style">;

export function DropdownMenuSeparator({
  className,
  ...props
}: DropdownMenuSeparatorProps) {
  return (
    <BaseMenu.Separator {...props} className={cn(menuSeparator, className)} />
  );
}

export type DropdownMenuRadioGroupProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 这一组的小标题 */
  label?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
};

/** 一组里只有一个"当前项"的选项，比如语言、排序方式。 */
export function DropdownMenuRadioGroup({
  value,
  defaultValue,
  onValueChange,
  label,
  disabled,
  children,
}: DropdownMenuRadioGroupProps) {
  const group = (
    <BaseMenu.RadioGroup
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange && ((next) => onValueChange(String(next)))}
      disabled={disabled}
    >
      {children}
    </BaseMenu.RadioGroup>
  );

  if (!label) return group;
  return (
    <BaseMenu.Group>
      <BaseMenu.GroupLabel className={menuGroupLabel}>{label}</BaseMenu.GroupLabel>
      {group}
    </BaseMenu.Group>
  );
}

export type DropdownMenuRadioItemProps = Omit<
  ComponentProps<"div">,
  "id" | "style" | "onClick"
> & {
  value: string;
  disabled?: boolean;
  /** 行尾的补充 */
  end?: ReactNode;
  /** 选了之后是否关掉菜单，默认关 */
  closeOnClick?: boolean;
};

export function DropdownMenuRadioItem({
  value,
  disabled,
  end,
  closeOnClick = true,
  className,
  children,
  ...props
}: DropdownMenuRadioItemProps) {
  const variant = useContext(MenuVariantContext);

  return (
    <BaseMenu.RadioItem
      {...props}
      value={value}
      disabled={disabled}
      closeOnClick={closeOnClick}
      className={(state) =>
        cn(
          menuItem,
          state.checked ? menuItemCurrent[variant] : menuItemHover,
          className,
        )
      }
    >
      {itemContent(null, children, end)}
    </BaseMenu.RadioItem>
  );
}
