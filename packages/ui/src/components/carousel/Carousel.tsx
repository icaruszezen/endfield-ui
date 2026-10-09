import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { ChevronLeft } from "../../icons/ChevronLeft";
import { ChevronRight } from "../../icons/ChevronRight";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { DashIndicator } from "../dash-indicator/DashIndicator";
import { IconButton } from "../icon-button/IconButton";

export type CarouselRatio = "16/9" | "4/3" | "1/1" | "3/4" | "21/9";

const ratioClass: Record<CarouselRatio, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-4/3",
  "1/1": "aspect-square",
  "3/4": "aspect-3/4",
  "21/9": "aspect-21/9",
};

const SlideContext = createContext<{
  position: number;
  count: number;
  current: boolean;
} | null>(null);

export type CarouselProps = Omit<
  ComponentProps<"section">,
  "aria-label" | "onChange"
> & {
  /** 这组媒体是什么，比如"玩法介绍" */
  "aria-label": string;
  /** 现在是第几张，从 0 起 */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** 到头之后绕回另一头。默认到头时翻页钮禁用 */
  loop?: boolean;
  /** 媒体的宽高比，默认 `16/9` */
  ratio?: CarouselRatio;
  /** 计数旁边再加一排进度短横 */
  indicator?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  /** 直接放 `CarouselSlide` */
  children: ReactNode;
};

type SlideLike = { title?: ReactNode; description?: ReactNode };

/** 滚动停下之后多久算"停稳了"。没有 scrollend 事件的浏览器靠它 */
const SETTLE_MS = 120;

/**
 * 媒体轮播：一次看一张的大幅媒体，前后翻。不自动播放。
 * 轨道是原生的横向滚动加滚动吸附，触屏滑动是浏览器自带的。
 */
export function Carousel({
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  loop = false,
  ratio = "16/9",
  indicator = false,
  previousLabel = "上一张",
  nextLabel = "下一张",
  className,
  children,
  ...props
}: CarouselProps) {
  // 标题和说明从子元素上读，所以子元素必须直接是 CarouselSlide
  const slides = Children.toArray(children).filter((child) =>
    isValidElement<SlideLike>(child),
  );
  const count = slides.length;
  const last = Math.max(0, count - 1);

  const [rawIndex, setIndex] = useControllableState({
    value: indexProp,
    defaultValue: defaultIndex,
    onChange: onIndexChange,
  });
  const index = Math.min(Math.max(rawIndex, 0), last);
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 给不跟着渲染重建的回调（尺寸变化）读最新的下标
  const indexRef = useRef(index);
  indexRef.current = index;

  const go = (next: number) => {
    if (count === 0) return;
    const target = loop
      ? (next + count) % count
      : Math.min(Math.max(next, 0), last);
    setIndex(target);
    // 到头了，刚按的那个翻页钮马上要禁用：把焦点交给媒体，键盘还能接着用方向键翻回去
    if (
      !loop &&
      (target === 0 || target === last) &&
      document.activeElement instanceof HTMLButtonElement &&
      trackRef.current?.parentElement?.contains(document.activeElement)
    ) {
      trackRef.current.focus({ preventScroll: true });
    }
  };

  // 下标变了：滚过去。已经在那儿（用户自己滑过去的）就不动
  useEffect(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    if (Math.round(track.scrollLeft / track.clientWidth) === index) return;
    track.scrollTo?.({ left: index * track.clientWidth, behavior: "smooth" });
  }, [index]);

  // 宽度变了：轨道的滚动位置是像素，会错开，重新对到当前这一张（不要动画）
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      track.scrollTo?.({
        left: indexRef.current * track.clientWidth,
        behavior: "instant",
      });
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  // 用户自己滑：等滚动停稳，由停下的位置定下标。滚动途中不改——
  // 翻页钮触发的滚动会路过中间那几张
  const onScroll = useCallback(() => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const stopped = Math.round(track.scrollLeft / track.clientWidth);
      setIndex(Math.min(Math.max(stopped, 0), last));
    }, SETTLE_MS);
  }, [setIndex, last]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const next = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    go(next);
  };

  const current = slides[index] as { props: SlideLike } | undefined;
  const place = `第 ${index + 1} 张，共 ${count} 张`;

  return (
    <section
      {...props}
      role="group"
      aria-roledescription="轮播"
      data-ratio={ratio}
      className={cn("flex flex-col gap-3 text-ink", className)}
    >
      <div className="relative isolate">
        <div
          ref={trackRef}
          // 能聚焦：键盘要能在媒体上用方向键翻页
          tabIndex={0}
          onScroll={onScroll}
          // 只管焦点就在轨道上的时候：幻灯片里的控件（视频的进度条）自己要用方向键
          onKeyDown={(event) => {
            if (event.target === event.currentTarget) onKeyDown(event);
          }}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-surface-muted [scrollbar-width:none]",
            // 环画在外面：画在里面会被幻灯片盖住（它们是定位元素，画在轨道的轮廓之上）
            focusRing,
            ratioClass[ratio],
          )}
        >
          {slides.map((slide, position) => (
            <SlideContext
              key={position}
              value={{ position, count, current: position === index }}
            >
              {slide}
            </SlideContext>
          ))}
        </div>
        {/* 压在媒体左下角的一对圆钮。它们在轨道外面：轨道滚的时候不跟着走 */}
        <div
          onKeyDown={onKeyDown}
          className="absolute bottom-3 left-3 z-1 flex gap-2"
        >
          <IconButton
            variant="floating"
            aria-label={previousLabel}
            disabled={!loop && index <= 0}
            onClick={() => go(index - 1)}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            variant="floating"
            aria-label={nextLabel}
            disabled={!loop && index >= last}
            onClick={() => go(index + 1)}
          >
            <ChevronRight />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {/* 看得见的计数和短横只给眼睛：同样的话下面的说明区会播报 */}
        <div aria-hidden="true" className="flex items-center gap-3">
          <span className="font-tech text-xs text-ink-secondary tabular-nums">
            {`${index + 1} / ${count}`}
          </span>
          {indicator && <DashIndicator count={count} index={index} />}
        </div>
        <div aria-live="polite" className="flex flex-col gap-1">
          <span className="sr-only">{place}</span>
          {current?.props.title && (
            <p className="text-lg font-bold wrap-anywhere">
              {current.props.title}
            </p>
          )}
          {current?.props.description && (
            <p className="text-sm text-ink-secondary">
              {current.props.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export type CarouselSlideProps = Omit<ComponentProps<"div">, "title"> & {
  /** 这一张的标题，显示在媒体下方 */
  title?: ReactNode;
  /** 标题下面的一段正文 */
  description?: ReactNode;
  /** 媒体：一张图或一段视频，铺满并裁切 */
  children: ReactNode;
};

/** 轮播里的一张。直接放在 `Carousel` 里。 */
export function CarouselSlide({
  // 标题和说明由 Carousel 读走，画在媒体下面
  title: _title,
  description: _description,
  className,
  children,
  ...props
}: CarouselSlideProps) {
  const slide = useContext(SlideContext);
  if (!slide) {
    throw new Error("CarouselSlide 要直接放在 Carousel 里面");
  }

  return (
    <div
      {...props}
      role="group"
      aria-roledescription="幻灯片"
      aria-label={`第 ${slide.position + 1} 张，共 ${slide.count} 张`}
      // 不在眼前的：里面的链接、视频控件 Tab 走不进去，读屏也读不到
      inert={!slide.current}
      data-current={slide.current ? "" : undefined}
      className={cn(
        "relative size-full shrink-0 snap-start overflow-clip *:size-full *:object-cover",
        className,
      )}
    >
      {children}
    </div>
  );
}
