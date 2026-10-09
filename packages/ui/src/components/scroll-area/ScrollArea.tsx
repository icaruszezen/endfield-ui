import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps, CSSProperties, Ref } from "react";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

export type ScrollAreaProps = Omit<
  ComponentProps<"div">,
  "aria-label" | "className" | "style" | "ref"
> & {
  /** 这一块是什么。能滚的时候它是一个能聚焦的区域，读屏听到的就是这个名称 */
  "aria-label": string;
  /** 哪个方向能滚，默认 `vertical`。只管一个方向时，另一个方向滚不了 */
  orientation?: ScrollAreaOrientation;
  /** 真正在滚的那个元素：给页内目录、回到顶部的 `target` */
  viewportRef?: Ref<HTMLDivElement>;
  /** 给外框：高度或者高度上限写在这里 */
  className?: string;
  style?: CSSProperties;
  /** 给外框 */
  ref?: Ref<HTMLDivElement>;
};

/*
 * 滚动条：12px 宽的一条是能抓、能点的范围；正中一条 1px 的轨，
 * 滑块是压在轨上的一段 3px 的粗条——和页内目录、侧轨二级的引线是同一个画法
 */
const barClass: Record<"vertical" | "horizontal", string> = {
  vertical:
    "w-3 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-line",
  horizontal:
    "h-3 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-line",
};

const thumbClass: Record<"vertical" | "horizontal", string> = {
  vertical:
    "w-full before:inset-y-0 before:left-1/2 before:w-[3px] before:-translate-x-1/2",
  horizontal:
    "h-full before:inset-x-0 before:top-1/2 before:h-[3px] before:-translate-y-1/2",
};

function Scrollbar({
  orientation,
}: {
  orientation: "vertical" | "horizontal";
}) {
  return (
    <BaseScrollArea.Scrollbar
      orientation={orientation}
      className={cn("group/bar flex", barClass[orientation])}
    >
      <BaseScrollArea.Thumb
        className={cn(
          "relative before:absolute before:bg-ink-secondary before:content-['']",
          "before:transition-colors before:duration-(--duration-fast) before:ease-standard",
          "group-hover/bar:before:bg-ink active:before:bg-ink",
          // 高对比模式下背景色会被系统拿掉：换成系统的文字色，滑块才看得见
          "forced-colors:before:bg-[CanvasText]",
          thumbClass[orientation],
        )}
      />
    </BaseScrollArea.Scrollbar>
  );
}

/**
 * 滚动区：一块自己能滚的区域，滚动条是画出来的。高度（或高度上限）由 `className` 给。
 * 只有真的溢出时才有滚动条，也才是一个能聚焦的区域。
 *
 * 整页的滚动留给浏览器，不要把页面主体包进来。
 * `className` 与 `ref` 给外框，其余属性（`onScroll` 等）给真正在滚的可视区。
 */
export function ScrollArea({
  "aria-label": label,
  orientation = "vertical",
  viewportRef,
  className,
  style,
  ref,
  children,
  ...props
}: ScrollAreaProps) {
  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";

  return (
    <BaseScrollArea.Root
      ref={ref}
      style={style}
      data-scroll-area=""
      data-orientation={orientation}
      // 给了高度上限时内容短就跟着矮：外框是一个竖排的弹性容器，可视区在里面收缩
      className={cn("flex min-h-0 min-w-0 flex-col text-ink", className)}
    >
      <BaseScrollArea.Viewport
        {...props}
        ref={viewportRef}
        // 不管的那个方向不让滚（基元默认两个方向都是 scroll）
        style={
          orientation === "vertical"
            ? { overflowX: "hidden" }
            : orientation === "horizontal"
              ? { overflowY: "hidden" }
              : undefined
        }
        className={cn(
          "min-h-0 flex-auto",
          focusRingInset,
          // 溢出的那一侧让出滚动条的位置，内容不会被压住。让的是可视区自己的外边距：
          // 写成内边距的话，它在滚动容器里是"滚到头才有的留白"，途中内容照样被压住
          vertical && "data-has-overflow-y:mr-3",
          horizontal && "data-has-overflow-x:mb-3",
        )}
        render={(viewportProps, state) => {
          const scrollable =
            (vertical && state.hasOverflowY) ||
            (horizontal && state.hasOverflowX);
          return (
            <div
              {...viewportProps}
              // 只有真的能滚时才是一个有名称、能聚焦的区域：键盘要能滚它，
              // 但不溢出的时候不该白占一个 Tab 停靠点
              {...(scrollable && { role: "region", "aria-label": label })}
              tabIndex={scrollable ? 0 : -1}
            />
          );
        }}
      >
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {vertical && <Scrollbar orientation="vertical" />}
      {horizontal && <Scrollbar orientation="horizontal" />}
      {orientation === "both" && <BaseScrollArea.Corner />}
    </BaseScrollArea.Root>
  );
}
