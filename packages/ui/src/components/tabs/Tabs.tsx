import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { TriangleRight } from "../../icons/TriangleRight";
import { cn } from "../../lib/cn";
import { focusRing, focusRingInset } from "../../lib/focus-ring";
import { capsuleBase, capsuleSize, capsuleState } from "../chip/capsule-style";

export type TabsVariant = "block" | "capsule" | "wedge";
export type TabsSize = "sm" | "md";

type TabsContextValue = {
  value: string;
  select: (value: string) => void;
  baseId: string;
  variant: TabsVariant;
  size: TabsSize;
  /** 切换过没有：一开始选中的那一块面板是静止的，切过来的才淡入 */
  switched: boolean;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`<${component}> 必须放在 <Tabs> 里`);
  }
  return context;
}

/** 页签值可以是任意字符串，拼进 id 之前先换掉不能出现在 IDREF 里的字符 */
function toId(baseId: string, kind: "tab" | "panel", value: string) {
  return `${baseId}-${kind}-${value.replace(/[^\w-]/g, "_")}`;
}

type TabsOwnProps = {
  /**
   * - `block` 直角的格子，之间是不通顶的竖线；激活时文字让位给箭头。默认；
   * - `capsule` 横向胶囊，选中反转为墨底。筛选、类目切换；
   * - `wedge` 选中项是黄底墨字、右侧斜切的楔形。游戏风格界面的一级页签。
   */
  variant?: TabsVariant;
  size?: TabsSize;
  onValueChange?: (value: string) => void;
} & (
  | { /** 受控 */ value: string; defaultValue?: never }
  | { /** 非受控时的初始页签 */ defaultValue: string; value?: never }
);

export type TabsProps = Omit<ComponentProps<"div">, keyof TabsOwnProps> &
  TabsOwnProps;

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  variant = "block",
  size = "md",
  ...props
}: TabsProps) {
  const baseId = useId();
  const [current, select] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  });

  const [initial] = useState(current);
  const [switched, setSwitched] = useState(false);
  if (!switched && current !== initial) setSwitched(true);

  const context = useMemo(
    () => ({ value: current, select, baseId, variant, size, switched }),
    [current, select, baseId, variant, size, switched],
  );

  return (
    <TabsContext value={context}>
      <div {...props} data-variant={variant} />
    </TabsContext>
  );
}

export type TabListProps = ComponentProps<"div">;

export function TabList({ className, onKeyDown, ...props }: TabListProps) {
  const { variant } = useTabsContext("TabList");

  // 漫游 tabindex：方向键在页签之间移动焦点并直接切换
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    );
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;

    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        next = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const target = tabs[next];
    target?.focus();
    target?.click();
  };

  return (
    <div
      {...props}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(
        // 页签很多时横向滚动，不换行
        "flex overflow-x-auto [scrollbar-width:thin]",
        variant === "capsule" && "gap-2 p-1",
        // 楔形坐在一条墨线上：亮色页面上黄色对白底的明度差很小，靠这条线托住
        variant === "wedge" && "border-b-2 border-ink",
        className,
      )}
    />
  );
}

export type TabProps = Omit<ComponentProps<"button">, "value"> & {
  value: string;
};

const blockSize: Record<TabsSize, string> = {
  sm: "h-9 px-7 text-base",
  md: "h-10 px-8 text-lg",
};

const blockLabelShift: Record<TabsSize, string> = {
  sm: "-translate-x-2.5",
  md: "-translate-x-3",
};

const blockArrow: Record<TabsSize, string> = {
  sm: "right-1.5 size-5 [&_svg]:size-2.5",
  md: "right-2 size-6 [&_svg]:size-3",
};

/* 右侧多留一段：斜边占掉了 10px */
const wedgeSize: Record<TabsSize, string> = {
  sm: "h-9 pr-8 pl-5 text-base",
  md: "h-10 pr-9 pl-6 text-lg",
};

export function Tab({
  value,
  disabled = false,
  className,
  children,
  onClick,
  ...props
}: TabProps) {
  const context = useTabsContext("Tab");
  const selected = context.value === value;
  const { variant, size } = context;

  const shared = {
    ...props,
    type: "button" as const,
    role: "tab",
    id: toId(context.baseId, "tab", value),
    "aria-selected": selected,
    "aria-controls": toId(context.baseId, "panel", value),
    tabIndex: selected ? 0 : -1,
    disabled,
    "data-selected": selected ? "" : undefined,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) context.select(value);
    },
  };

  if (variant === "capsule") {
    return (
      <button
        {...shared}
        className={cn(
          capsuleBase,
          focusRing,
          capsuleSize[size],
          selected
            ? capsuleState.selected
            : disabled
              ? capsuleState.disabled
              : capsuleState.rest,
          className,
        )}
      >
        {children}
      </button>
    );
  }

  if (variant === "wedge") {
    return (
      <button
        {...shared}
        className={cn(
          "relative isolate inline-flex shrink-0 items-center justify-center leading-none font-medium whitespace-nowrap",
          "transition-colors duration-(--duration-fast) ease-standard",
          // 楔形画在伪元素的底上：按钮本身不裁切，焦点环才是完整的
          "before:absolute before:inset-0 before:-z-10 before:wedge-r before:transition-colors before:duration-(--duration-fast) before:ease-standard before:content-['']",
          focusRingInset,
          wedgeSize[size],
          selected
            ? "text-on-action before:bg-action"
            : disabled
              ? "cursor-not-allowed text-ink-disabled"
              : "text-ink hover:before:bg-ink/5",
          className,
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      {...shared}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center leading-none font-medium whitespace-nowrap",
        "transition-colors duration-(--duration-fast) ease-standard",
        // 页签之间的竖线：2px、三分之二高、不通顶。紧挨激活项的两条让给它的底色
        "before:absolute before:top-1/6 before:left-0 before:h-2/3 before:w-0.5 before:bg-line before:content-[''] first:before:hidden [[data-selected]+&]:before:hidden",
        focusRingInset,
        blockSize[size],
        selected
          ? "bg-surface-muted text-ink before:hidden"
          : disabled
            ? "cursor-not-allowed text-ink-disabled"
            : "text-ink hover:bg-ink/5",
        className,
      )}
    >
      {/* 激活：文字左移，右侧的箭头块淡入——新元素出现时旧元素让位 */}
      <span
        className={cn(
          "transition-[translate] duration-(--duration-base) ease-standard",
          selected && blockLabelShift[size],
        )}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center bg-surface-raised text-ink",
          "transition-opacity duration-(--duration-base) ease-standard",
          blockArrow[size],
          selected ? "opacity-100" : "opacity-0",
        )}
      >
        <TriangleRight />
      </span>
    </button>
  );
}

export type TabPanelProps = ComponentProps<"div"> & {
  value: string;
};

/**
 * 未选中的面板保留一个隐藏的空容器，让页签的 `aria-controls` 始终有所指。
 * 切过来的面板淡入；一开始就选中的那一块不动。
 */
export function TabPanel({
  value,
  className,
  children,
  ...props
}: TabPanelProps) {
  const context = useTabsContext("TabPanel");
  const selected = context.value === value;

  return (
    <div
      {...props}
      role="tabpanel"
      id={toId(context.baseId, "panel", value)}
      aria-labelledby={toId(context.baseId, "tab", value)}
      hidden={!selected}
      tabIndex={0}
      className={cn(
        focusRing,
        // 只淡入、不位移：页签本身已经有"让位"的动作
        selected &&
          context.switched &&
          "animate-fade-in [animation-duration:var(--duration-fast)]",
        className,
      )}
    >
      {selected ? children : null}
    </div>
  );
}
