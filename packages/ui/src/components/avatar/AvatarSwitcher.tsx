import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { ChevronDown } from "../../icons/ChevronDown";
import { ChevronLeft } from "../../icons/ChevronLeft";
import { ChevronRight } from "../../icons/ChevronRight";
import { cn } from "../../lib/cn";
import { IconButton } from "../icon-button/IconButton";
import { Avatar, type AvatarSize } from "./Avatar";

export type AvatarSwitcherOrientation = "vertical" | "horizontal";

type SwitcherContextValue = {
  name: string;
  value: string | null;
  size: AvatarSize;
  select: (value: string) => void;
};

const SwitcherContext = createContext<SwitcherContextValue | null>(null);

export type AvatarSwitcherProps = Omit<
  ComponentProps<"div">,
  "aria-label" | "defaultValue" | "onChange"
> & {
  /** 选的是什么，比如"人员" */
  "aria-label": string;
  /** 选中的那一个的 `value` */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 竖排（默认）或横排 */
  orientation?: AvatarSwitcherOrientation;
  /** 头像的大小，默认 `lg`（56px） */
  size?: AvatarSize;
  /** 翻页钮到头之后绕回另一头。默认到头时禁用 */
  loop?: boolean;
  /** 表单字段名：选中的值会随表单提交 */
  name?: string;
  previousLabel?: string;
  nextLabel?: string;
  /** 直接放 `AvatarSwitcherItem` */
  children: ReactNode;
};

type ItemLike = { value?: unknown; disabled?: unknown };

/**
 * 头像切换：一列圆形头像里选一个，两端各一个圆形翻页钮。
 * 语义是单选组——方向键换人。头像放不下时给它一个高度（横排时是宽度）上限，
 * 头像在两个翻页钮之间滚动。
 */
export function AvatarSwitcher({
  value: valueProp,
  defaultValue,
  onValueChange,
  orientation = "vertical",
  size = "lg",
  loop = false,
  name: nameProp,
  previousLabel = "上一个",
  nextLabel = "下一个",
  className,
  children,
  ...props
}: AvatarSwitcherProps) {
  const generatedName = useId();
  const name = nameProp ?? generatedName;
  const vertical = orientation === "vertical";
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next);
    },
  });

  // 翻页钮要知道前后是谁：从子元素上读，所以子元素必须直接是 AvatarSwitcherItem
  const values = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<ItemLike>(child)) return [];
    const { value: itemValue, disabled } = child.props;
    return typeof itemValue === "string" && !disabled ? [itemValue] : [];
  });
  const index = value === null ? -1 : values.indexOf(value);
  const last = values.length - 1;
  const step = (delta: 1 | -1) => {
    if (values.length === 0) return;
    const next =
      index === -1
        ? delta === 1
          ? 0
          : last
        : loop
          ? (index + delta + values.length) % values.length
          : Math.min(last, Math.max(0, index + delta));
    setValue(values[next]!);
  };

  // 选中的那个滚进来。只动自己的滚动容器，不带着页面一起滚
  useEffect(() => {
    const scroller = scrollerRef.current;
    const item = scroller?.querySelector<HTMLElement>("[data-current]");
    if (!scroller || !item) return;
    const start = vertical ? item.offsetTop : item.offsetLeft;
    const length = vertical ? item.offsetHeight : item.offsetWidth;
    const view = vertical ? scroller.clientHeight : scroller.clientWidth;
    const scrolled = vertical ? scroller.scrollTop : scroller.scrollLeft;
    // 留出选中环和焦点环的位置
    const margin = 12;
    let target = scrolled;
    if (start - margin < scrolled) target = start - margin;
    else if (start + length + margin > scrolled + view) {
      target = start + length + margin - view;
    }
    if (target !== scrolled) {
      scroller.scrollTo?.(vertical ? { top: target } : { left: target });
    }
  }, [value, vertical]);

  const context = useMemo(
    () => ({ name, value, size, select: setValue }),
    [name, value, size, setValue],
  );

  const Previous = vertical ? ChevronDown : ChevronLeft;
  const Next = vertical ? ChevronDown : ChevronRight;

  return (
    <SwitcherContext value={context}>
      <div
        {...props}
        role="radiogroup"
        aria-orientation={orientation}
        data-orientation={orientation}
        className={cn(
          // 比容器宽的时候缩到容器的宽度：头像在两个翻页钮之间滚动，不撑破页面
          "inline-flex max-w-full items-center gap-1",
          vertical ? "flex-col" : "flex-row",
          className,
        )}
      >
        {/* 翻页钮不占 Tab 顺序：键盘在单选组里用方向键就够了 */}
        <IconButton
          variant="floating"
          size="sm"
          tabIndex={-1}
          aria-label={previousLabel}
          disabled={!loop && index <= 0}
          onClick={() => step(-1)}
        >
          <Previous className={vertical ? "rotate-180" : undefined} />
        </IconButton>
        <div
          ref={scrollerRef}
          className={cn(
            // 内边距给选中环和焦点环留位置，否则会被滚动容器裁掉
            "relative flex min-h-0 min-w-0 flex-1 gap-4 p-3 [scrollbar-width:none]",
            vertical
              ? "flex-col overflow-x-hidden overflow-y-auto"
              : "flex-row overflow-x-auto overflow-y-hidden",
          )}
        >
          {children}
        </div>
        <IconButton
          variant="floating"
          size="sm"
          tabIndex={-1}
          aria-label={nextLabel}
          disabled={!loop && index >= last}
          onClick={() => step(1)}
        >
          <Next />
        </IconButton>
      </div>
    </SwitcherContext>
  );
}

type ItemOwnProps = {
  value: string;
  /** 名字：这一项的可访问名称，没有图时显示它的首字 */
  label: string;
  /** 头像的图片地址 */
  src?: string;
  disabled?: boolean;
  /** 没有图时显示的东西，代替首字 */
  children?: ReactNode;
};

export type AvatarSwitcherItemProps = ItemOwnProps &
  Omit<ComponentProps<"label">, keyof ItemOwnProps>;

/** 头像切换里的一个头像。 */
export function AvatarSwitcherItem({
  value,
  label,
  src,
  disabled = false,
  className,
  children,
  ...props
}: AvatarSwitcherItemProps) {
  const context = useContext(SwitcherContext);
  if (!context) {
    throw new Error("AvatarSwitcherItem 要放在 AvatarSwitcher 里面");
  }
  const checked = context.value === value;

  return (
    <label
      {...props}
      data-current={checked ? "" : undefined}
      className={cn(
        "relative flex shrink-0 rounded-full",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="radio"
        name={context.name}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={() => context.select(value)}
        className="peer absolute inset-0 size-full cursor-[inherit] appearance-none rounded-full outline-none"
      />
      <Avatar
        name={label}
        src={src}
        alt=""
        size={context.size}
        selected={checked}
        className={cn(
          "pointer-events-none transition-opacity duration-(--duration-fast) ease-standard",
          // 选中不只靠那一圈黄：其余的退后一档
          !checked && "opacity-60 peer-hover:opacity-100",
          disabled && "opacity-30 peer-hover:opacity-30",
          // 焦点环画在选中环（6px）的外面，隔 1px
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[7px] peer-focus-visible:outline-focus",
        )}
      >
        {children}
      </Avatar>
    </label>
  );
}
