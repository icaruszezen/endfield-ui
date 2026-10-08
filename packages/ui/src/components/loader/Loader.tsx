import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { cn } from "../../lib/cn";

export type LoaderProps = Omit<ComponentProps<"div">, "children"> & {
  /** 真实进度，0 – 100。不知道就不传：显示不确定进度，不显示数字 */
  value?: number;
  /** 进度下方的一行标语 */
  tagline?: ReactNode;
  /** 置为 `false` 时遮罩向上滑出，结束后卸载。默认 `true` */
  open?: boolean;
  /** 铺满视口并锁住页面（默认）；关掉则铺满所在的定位容器 */
  fullscreen?: boolean;
  /** 进度条的可访问名称 */
  label?: string;
  /** 滑出结束、已经卸载之后触发 */
  onExited?: () => void;
};

/** 滑出的时长，与 `--duration-slower` 一致；过渡事件没来时靠它兜底 */
const EXIT_MS = 600;

/**
 * 加载页：近黑底、大号等宽百分比、一行标语、黄色进度条。只用于整页的首次加载。
 * 不伪造进度；内容就绪后立刻把 `open` 置为 `false`，不要为了播完动画而等待。
 */
export function Loader({
  value,
  tagline,
  open = true,
  fullscreen = true,
  label = "加载中",
  onExited,
  onKeyDown,
  onTransitionEnd,
  className,
  ...props
}: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  // 重新打开：立刻挂回来
  if (open && !mounted) setMounted(true);

  const onExitedRef = useRef(onExited);
  useEffect(() => {
    onExitedRef.current = onExited;
  });

  const leaving = !open && mounted;

  // 退出：滑出的过渡结束后卸载。没有过渡的环境里事件不会来，由定时器兜底
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => {
      setMounted(false);
      onExitedRef.current?.();
    }, EXIT_MS + 100);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // 整页模式：加载期间锁住页面滚动，把焦点收进来；开始退出时就放开
  useEffect(() => {
    if (!fullscreen || !open) return;
    const page = document.documentElement;
    const previousOverflow = page.style.overflow;
    const previousFocus = document.activeElement;
    page.style.overflow = "hidden";
    rootRef.current?.focus({ preventScroll: true });
    return () => {
      page.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [fullscreen, open]);

  if (!mounted) return null;

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    onTransitionEnd?.(event);
    if (leaving && event.target === event.currentTarget) {
      setMounted(false);
      onExitedRef.current?.();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    // 整页加载时焦点留在加载页上，不让 Tab 走到被盖住的内容里
    if (fullscreen && open && event.key === "Tab") event.preventDefault();
  };

  const indeterminate = value === undefined;
  const current = indeterminate ? 0 : Math.min(Math.max(value, 0), 100);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      {...props}
      data-state={open ? "open" : "closing"}
      onKeyDown={handleKeyDown}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        // 有意不随主题变：加载页是固定的近黑底
        "@container flex flex-col justify-end bg-neutral-950 text-neutral-0 outline-none",
        fullscreen ? "fixed inset-0 z-(--z-loader)" : "absolute inset-0",
        "transition-[translate] duration-(--duration-slower) ease-emphasis",
        open ? "translate-y-0" : "pointer-events-none -translate-y-full",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6 @md:p-10">
        {!indeterminate && (
          // 数字与 % 两种字号；确切的值由下面的进度条交给读屏
          <p
            aria-hidden="true"
            className="font-tech leading-none font-medium tabular-nums"
          >
            <span className="text-4xl @md:text-5xl">{Math.round(current)}</span>
            <span className="text-2xl font-normal @md:text-4xl">%</span>
          </p>
        )}
        {tagline !== undefined && (
          <p className="text-base @md:text-xl">{tagline}</p>
        )}
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={indeterminate ? undefined : current}
          className="relative h-1.5 overflow-hidden rounded-sm bg-neutral-800"
        >
          {indeterminate ? (
            <span className="absolute inset-y-0 left-0 w-2/5 animate-indeterminate bg-action motion-reduce:translate-x-3/4" />
          ) : (
            <span
              className="absolute inset-0 origin-left bg-action transition-transform duration-(--duration-base) ease-standard"
              style={{ transform: `scaleX(${current / 100})` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
