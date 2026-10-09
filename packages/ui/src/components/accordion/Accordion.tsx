import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Minus } from "../../icons/Minus";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";

export type AccordionSize = "sm" | "md";
export type AccordionLevel = 2 | 3 | 4 | 5 | 6;

const AccordionContext = createContext<{
  size: AccordionSize;
  level: AccordionLevel;
}>({ size: "md", level: 3 });

export type AccordionProps = Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange" | "style"
> & {
  /** 可以同时展开几项。默认开了这个，那个就收起来 */
  multiple?: boolean;
  /** 展开着的那几项的 `value` */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** 标题行高 40 / 48px，默认 `md` */
  size?: AccordionSize;
  /** 标题的层级，默认 3（`<h3>`）。按它在页面里的位置给 */
  level?: AccordionLevel;
  /**
   * 收起的内容也留在页面里：浏览器的页内查找找得到，找到时自动展开。
   * 常见问题这类"来找一句话"的内容值得开
   */
  searchable?: boolean;
  disabled?: boolean;
  /** `AccordionItem` */
  children: ReactNode;
};

/**
 * 折叠面板：一摞可以各自展开收起的小节。先问能不能不折叠——
 * 藏起来的东西有人会找不到。
 */
export function Accordion({
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  level = 3,
  searchable = false,
  disabled,
  className,
  children,
  ...props
}: AccordionProps) {
  const context = useMemo(() => ({ size, level }), [size, level]);

  return (
    <AccordionContext value={context}>
      <BaseAccordion.Root
        {...props}
        multiple={multiple}
        value={value}
        defaultValue={defaultValue}
        onValueChange={
          onValueChange && ((next) => onValueChange(next as string[]))
        }
        hiddenUntilFound={searchable}
        disabled={disabled}
        data-size={size}
        className={cn("flex flex-col border-t border-line text-ink", className)}
      >
        {children}
      </BaseAccordion.Root>
    </AccordionContext>
  );
}

const triggerSize: Record<AccordionSize, string> = {
  sm: "min-h-10 py-1.5 text-sm",
  md: "min-h-12 py-2 text-base",
};

type ItemOwnProps = {
  /** 这一项的标识：`Accordion` 的 `value` 里放的就是它 */
  value: string;
  /** 标题：写成"里面是什么" */
  title: ReactNode;
  /** 标题右侧、记号之前的补充：计数、一个标签。它在按钮里，不能放能点的东西 */
  extra?: ReactNode;
  disabled?: boolean;
  /** 内容 */
  children: ReactNode;
};

export type AccordionItemProps = ItemOwnProps &
  Omit<ComponentProps<"div">, keyof ItemOwnProps | "style">;

/** 折叠面板里的一节。 */
export function AccordionItem({
  value,
  title,
  extra,
  disabled,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const { size, level } = useContext(AccordionContext);
  const Heading = `h${level}` as const;

  return (
    <BaseAccordion.Item
      {...props}
      value={value}
      disabled={disabled}
      className={cn("border-b border-line", className)}
    >
      <BaseAccordion.Header render={<Heading />} className="flex">
        <BaseAccordion.Trigger
          className={cn(
            "group/trigger flex w-full items-center gap-3 px-4 text-left font-medium",
            "transition-colors duration-(--duration-fast) ease-standard",
            "hover:bg-ink/5 data-panel-open:font-bold",
            "data-disabled:cursor-not-allowed data-disabled:text-ink-disabled data-disabled:hover:bg-transparent",
            focusRingInset,
            triggerSize[size],
          )}
        >
          <span className="min-w-0 flex-1 wrap-anywhere">{title}</span>
          {extra && (
            <span className="flex shrink-0 items-center gap-2 text-sm font-normal text-ink-secondary group-data-disabled/trigger:text-ink-disabled">
              {extra}
            </span>
          )}
          {/* 加号：两笔叠着，竖的那一笔在展开时转平，和横的重合成减号 */}
          <span
            aria-hidden="true"
            className="relative flex size-4 shrink-0 items-center justify-center text-ink-secondary group-data-disabled/trigger:text-ink-disabled"
          >
            <Minus size={16} />
            <Minus
              size={16}
              className="absolute rotate-90 transition-transform duration-(--duration-fast) ease-standard group-data-panel-open/trigger:rotate-0"
            />
          </span>
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel
        className={cn(
          "h-(--accordion-panel-height) overflow-hidden",
          "transition-[height] duration-(--duration-base) ease-standard",
          "data-ending-style:h-0 data-starting-style:h-0",
        )}
      >
        <div className={cn("px-4 pb-4", size === "sm" && "text-sm")}>
          {children}
        </div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  );
}
