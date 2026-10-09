import {
  useCallback,
  type ComponentProps,
  type MouseEvent,
  type RefObject,
} from "react";
import {
  useScrollPosition,
  type ScrollMetrics,
} from "../../hooks/useScrollPosition";
import { ArrowRight } from "../../icons/ArrowRight";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";

export type BackToTopSize = "sm" | "md";

export type BackToTopProps = Omit<
  ComponentProps<"button">,
  "children" | "aria-label"
> & {
  /** 默认"回到顶部" */
  "aria-label"?: string;
  /** 看哪个滚动容器、回到谁的顶部。不传就是整个页面 */
  target?: RefObject<HTMLElement | null>;
  /** 滚过多少像素才出现，默认 400 */
  threshold?: number;
  /** 48px（默认）或 40px 见方 */
  size?: BackToTopSize;
};

const sizeClass: Record<BackToTopSize, string> = {
  sm: "size-10 [&_svg]:size-5",
  md: "size-12 [&_svg]:size-6",
};

/**
 * 把焦点交给一个本来不能聚焦的元素：下一次 Tab 从它里面的头上开始。
 * 它不是控件，所以不画焦点环；焦点一走就把临时加的东西收回来。
 */
function handFocusTo(node: HTMLElement) {
  if (node.hasAttribute("tabindex")) {
    node.focus({ preventScroll: true });
    return;
  }
  const outline = node.style.outline;
  node.setAttribute("tabindex", "-1");
  node.style.outline = "none";
  node.focus({ preventScroll: true });
  node.addEventListener(
    "blur",
    () => {
      node.removeAttribute("tabindex");
      node.style.outline = outline;
    },
    { once: true },
  );
}

/**
 * 回到顶部：滚过一段才出现的悬浮钮，点了回到最上面，焦点也跟着回去。
 * 默认看整个页面、自己 `fixed` 在视口右下角；放进某个滚动容器时传 `target`，
 * 并用 `className` 把位置改成相对那个容器的。
 */
export function BackToTop({
  "aria-label": ariaLabel = "回到顶部",
  target,
  threshold = 400,
  size = "md",
  type = "button",
  className,
  onClick,
  ...props
}: BackToTopProps) {
  const scrolledFar = useCallback(
    ({ scrolled }: ScrollMetrics) => scrolled > threshold,
    [threshold],
  );
  const visible = useScrollPosition(target, scrolledFar, false);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const element = target?.current ?? null;
    // 脚本里显式要的平滑滚动不归 CSS 那条全局规则管，要自己看"减少动态效果"
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const options: ScrollToOptions = {
      top: 0,
      behavior: reduce ? "instant" : "smooth",
    };
    if (element) element.scrollTo?.(options);
    else window.scrollTo(options);

    // 滚到顶之后这个钮会消失：焦点留在它身上就丢了，下一次 Tab 会从页尾开始
    handFocusTo(element ?? document.body);
  };

  return (
    <button
      {...props}
      type={type}
      aria-label={ariaLabel}
      data-visible={visible ? "" : undefined}
      data-size={size}
      onClick={handleClick}
      className={cn(
        "fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-(--z-float)",
        "inline-flex shrink-0 items-center justify-center shadow-md",
        // 反转填充：浮在任意内容上，两个主题下都和页面拉得开
        "bg-surface-inverse text-ink-inverse hover:bg-action hover:text-on-action active:bg-action-pressed active:text-on-action",
        "transition-[opacity,visibility,background-color,color] duration-(--duration-fast) ease-standard",
        focusRing,
        sizeClass[size],
        // 没出现时 visibility 是 hidden：Tab 到不了，读屏也读不到
        visible ? "visible opacity-100" : "invisible opacity-0",
        className,
      )}
    >
      <ArrowRight className="-rotate-90" />
    </button>
  );
}
