import { useEffect, useState, type RefObject } from "react";

export type ScrollMetrics = {
  /** 已经往下滚了多少 */
  scrolled: number;
  /** 一共能滚多少：内容的高度减去容器的高度 */
  room: number;
};

/**
 * 盯着一个滚动容器（不传就是整个页面），由滚动位置算出一个值。
 * 滚动、窗口尺寸变了、内容晚到（图片加载完）都会重新算；算出来的值没变就不重新渲染，
 * 所以 `read` 要返回布尔或数字这样的原始值，并且用 `useCallback` 固定住。
 *
 * 指定了容器但它还没挂上时，值停在 `initial`。
 */
export function useScrollPosition<T>(
  target: RefObject<HTMLElement | null> | undefined,
  read: (metrics: ScrollMetrics) => T,
  initial: T,
): T {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const element = target ? target.current : null;
    if (target && !element) return;

    const measure = () => {
      const box = element ?? document.documentElement;
      setValue(
        read({
          scrolled: element ? element.scrollTop : window.scrollY,
          room: box.scrollHeight - box.clientHeight,
        }),
      );
    };

    measure();
    const source = element ?? window;
    source.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element ?? document.body);
    }

    return () => {
      source.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [target, read]);

  return value;
}
