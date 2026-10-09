import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import type { LinkRender } from "../link-element/LinkElement";

export type ToolbarSize = "sm" | "md";
export type ToolbarVariant = "sunken" | "outline";
export type ToolbarOrientation = "horizontal" | "vertical";

const ToolbarContext = createContext<{
  size: ToolbarSize;
  orientation: ToolbarOrientation;
}>({ size: "md", orientation: "horizontal" });

export type ToolbarProps = Omit<
  ComponentProps<"div">,
  "aria-label" | "style"
> & {
  /** 这条工具栏管的是什么："表格工具" */
  "aria-label": string;
  /** 带子高 32 / 40px（里面的钮 28 / 36px），默认 `md`。触屏上用 `md` */
  size?: ToolbarSize;
  /**
   * - `sunken` 凹陷的底，默认；
   * - `outline` 四边描边，放在凹陷底色的区域里时用。
   */
  variant?: ToolbarVariant;
  /** 竖排时方向键换成上下 */
  orientation?: ToolbarOrientation;
  /** 整条禁用 */
  disabled?: boolean;
};

/* 带子的总高和输入框同档：2px 的内边距（描边时是 1px 的边 + 1px）加里面的钮 */
const barVariant: Record<ToolbarVariant, string> = {
  sunken: "bg-surface-sunken p-0.5",
  outline: "border border-line-strong bg-surface p-px",
};

/**
 * 工具栏：一排作用于同一个对象的小工具，收在一条带子里。整条只占一个 Tab 停靠点，
 * 方向键在各项之间走。里面放 `ToolbarButton`、`ToolbarToggle`、`ToolbarToggleGroup`、
 * `ToolbarGroup`、`ToolbarSeparator`。
 *
 * 不在里面放输入框：左右方向键在输入框里是移光标。
 */
export function Toolbar({
  size = "md",
  variant = "sunken",
  orientation = "horizontal",
  disabled = false,
  className,
  onKeyDown,
  ...props
}: ToolbarProps) {
  const context = useMemo(() => ({ size, orientation }), [size, orientation]);

  // 基元只管方向键，Home / End 在这里补上：到第一个、最后一个
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // 禁用的钮会把按键拦下（除了 Tab），到这里已经是"被拦下的"了：
    // 只认使用方在这一层自己拦的
    const already = event.defaultPrevented;
    onKeyDown?.(event);
    if (!already && event.defaultPrevented) return;
    if (event.key !== "Home" && event.key !== "End") return;
    // 工具栏里的每一项都带 tabindex（当前那个是 0，其余是 -1）
    const items = event.currentTarget.querySelectorAll<HTMLElement>(
      "button[tabindex], a[tabindex]",
    );
    const target = event.key === "Home" ? items[0] : items[items.length - 1];
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <ToolbarContext value={context}>
      <BaseToolbar.Root
        {...props}
        orientation={orientation}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        data-size={size}
        data-variant={variant}
        className={cn(
          "inline-flex max-w-full gap-0.5 text-ink",
          // 放不下就换行，不出横向滚动条
          orientation === "vertical" ? "flex-col" : "flex-wrap items-center",
          barVariant[variant],
          className,
        )}
      />
    </ToolbarContext>
  );
}

/*
 * 钮的点击区用伪元素补出去。`md` 四周各 2px，正好盖住钮之间的缝和带子的内边距，
 * 到 40 × 40px；`sm` 横向只能补到缝为止（再多就盖到旁边的钮上了），是 32 × 40px。
 */
const itemSize: Record<ToolbarSize, string> = {
  sm: "h-7 min-w-7 after:absolute after:-inset-x-0.5 after:-inset-y-1.5 after:content-['']",
  md: "h-9 min-w-9 after:absolute after:-inset-0.5 after:content-['']",
};

const itemPadding: Record<ToolbarSize, string> = {
  sm: "px-2",
  md: "px-2.5",
};

/* 只有图标时图标跟着档位走；旁边有字时都是 16px，和 `text-sm` 的字配 */
const iconOnlySize: Record<ToolbarSize, string> = {
  sm: "[&_svg]:size-4",
  md: "[&_svg]:size-5",
};

const itemBase = [
  "group/item relative inline-flex shrink-0 items-center justify-center gap-1.5",
  "text-sm leading-none font-medium whitespace-nowrap text-ink-secondary select-none",
  "transition-colors duration-(--duration-fast) ease-standard",
  "hover:bg-ink/5 hover:text-ink active:bg-ink/10",
  // 按下的开关钮、还开着的菜单的触发钮：填充反转。字是反转的墨色，图标是黄记号（见 itemIcon）
  "data-pressed:bg-surface-inverse data-pressed:text-ink-inverse",
  "data-popup-open:bg-surface-inverse data-popup-open:text-ink-inverse",
  "data-disabled:cursor-not-allowed data-disabled:bg-transparent data-disabled:text-ink-disabled",
  "data-disabled:data-pressed:bg-disabled data-disabled:data-pressed:text-on-disabled",
  // 焦点环压在旁边的钮上面
  "focus-visible:z-1",
  focusRing,
].join(" ");

/* 墨底黄记号，和 inverse 图标钮同一个样子；按下又禁用时跟着字一起降下去 */
const itemIcon = [
  "flex shrink-0",
  "group-data-pressed/item:text-accent-ink-inverse",
  "group-data-popup-open/item:text-accent-ink-inverse",
  "group-data-disabled/item:group-data-pressed/item:text-on-disabled",
].join(" ");

function useItemClass(iconOnly: boolean, className: string | undefined) {
  const { size } = useContext(ToolbarContext);
  return cn(
    itemBase,
    itemSize[size],
    iconOnly ? iconOnlySize[size] : [itemPadding[size], "[&_svg]:size-4"],
    className,
  );
}

function ItemContent({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {icon && <span className={itemIcon}>{icon}</span>}
      {children}
    </>
  );
}

/** 有字的钮名称就是字；只有图标的必须另给名称 */
type ItemContentProps =
  | { children: ReactNode; "aria-label"?: string }
  | { children?: undefined; "aria-label": string };

const hasText = (children: ReactNode) =>
  children !== undefined && children !== null && children !== false;

type ButtonOwnProps = {
  /** 图标，在文字左边 */
  icon?: ReactNode;
  disabled?: boolean;
  /** 传了就渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替 `<a>`（路由库的链接组件）。传了就按链接处理 */
  render?: LinkRender;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

export type ToolbarButtonProps = ButtonOwnProps &
  ItemContentProps &
  Omit<
    ComponentProps<"button">,
    keyof ButtonOwnProps | "children" | "aria-label" | "style"
  >;

/**
 * 工具栏里的一个钮。只有图标时是方的，必须有 `aria-label`。
 * 可以交给 `Menu` / `Popover` 的 `trigger`，也可以用 `Tooltip` 包住。
 */
export function ToolbarButton({
  icon,
  disabled = false,
  href,
  target,
  rel,
  render,
  onClick,
  type = "button",
  className,
  children,
  ...props
}: ToolbarButtonProps) {
  const classes = useItemClass(!hasText(children), className);
  const content = <ItemContent icon={icon}>{children}</ItemContent>;

  if (href !== undefined || render !== undefined) {
    return (
      <BaseToolbar.Link
        {...(props as ComponentProps<"a">)}
        render={render}
        // 禁用的链接去掉地址；用了 render 时地址在那个元素手里，只能拦下点击
        href={disabled ? undefined : href}
        target={target}
        rel={rel}
        role={disabled && render === undefined ? "link" : undefined}
        aria-disabled={disabled || undefined}
        data-disabled={disabled ? "" : undefined}
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        className={classes}
      >
        {content}
      </BaseToolbar.Link>
    );
  }

  return (
    <BaseToolbar.Button
      {...props}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      {content}
    </BaseToolbar.Button>
  );
}

type ToggleOwnProps = {
  /** 图标，在文字左边 */
  icon?: ReactNode;
  /** 受控的按下状态。放在 `ToolbarToggleGroup` 里时不用它，用 `value` */
  pressed?: boolean;
  /** 非受控时一开始是不是按下的 */
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** 在 `ToolbarToggleGroup` 里是这一个钮的标识：组的 `value` 里放的就是它 */
  value?: string;
  disabled?: boolean;
};

export type ToolbarToggleProps = ToggleOwnProps &
  ItemContentProps &
  Omit<
    ComponentProps<"button">,
    keyof ToggleOwnProps | "children" | "aria-label" | "aria-pressed" | "style"
  >;

/** 开关钮：按下是墨底黄记号。单独用，或者几个放进 `ToolbarToggleGroup`。 */
export function ToolbarToggle({
  icon,
  pressed,
  defaultPressed,
  onPressedChange,
  value,
  disabled = false,
  type = "button",
  className,
  children,
  ...props
}: ToolbarToggleProps) {
  const classes = useItemClass(!hasText(children), className);

  return (
    <BaseToolbar.Button
      {...props}
      type={type}
      disabled={disabled}
      render={
        <BaseToggle
          pressed={pressed}
          defaultPressed={defaultPressed}
          onPressedChange={onPressedChange && ((next) => onPressedChange(next))}
          value={value}
        />
      }
      className={classes}
    >
      <ItemContent icon={icon}>{children}</ItemContent>
    </BaseToolbar.Button>
  );
}

const groupClass =
  "flex gap-0.5 data-[orientation=horizontal]:flex-wrap data-[orientation=horizontal]:items-center data-[orientation=vertical]:flex-col";

export type ToolbarToggleGroupProps = Omit<
  ComponentProps<"div">,
  "aria-label" | "defaultValue" | "onChange" | "style"
> & {
  /** 这一组管的是什么："行高" */
  "aria-label": string;
  /** 按下的那几个钮的 `value` */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** 可以同时按下几个。默认按下这个，那个就弹起来；一个都不按也可以 */
  multiple?: boolean;
  disabled?: boolean;
};

/** 一组开关钮。值是数组：没有按下的就是空的。 */
export function ToolbarToggleGroup({
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  disabled,
  className,
  ...props
}: ToolbarToggleGroupProps) {
  const { orientation } = useContext(ToolbarContext);

  return (
    <BaseToggleGroup
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange && ((next) => onValueChange(next))}
      multiple={multiple}
      disabled={disabled}
      orientation={orientation}
      className={cn(groupClass, className)}
    />
  );
}

export type ToolbarGroupProps = Omit<
  ComponentProps<"div">,
  "aria-label" | "style"
> & {
  /** 这一组管的是什么 */
  "aria-label": string;
  /** 整组禁用 */
  disabled?: boolean;
};

/** 把几个钮在读屏里算成一组。看上去没有区别；要分开看，中间放 `ToolbarSeparator`。 */
export function ToolbarGroup({ className, ...props }: ToolbarGroupProps) {
  return <BaseToolbar.Group {...props} className={cn(groupClass, className)} />;
}

export type ToolbarSeparatorProps = Omit<ComponentProps<"div">, "style">;

/** 分隔：一条短线，方向和工具栏垂直。 */
export function ToolbarSeparator({
  className,
  ...props
}: ToolbarSeparatorProps) {
  return (
    <BaseToolbar.Separator
      {...props}
      className={cn(
        "shrink-0 self-center bg-line-strong",
        "data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:w-px",
        "data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-4",
        className,
      )}
    />
  );
}
