import { useEffect, useRef, useState, type RefObject } from "react";

type Options = {
  /** 为 true 时不观察，始终返回 false */
  disabled?: boolean;
  rootMargin?: string;
  threshold?: number;
};

/**
 * 元素第一次进入视口后返回 true，之后不再变回 false——入场动画只播一次。
 */
export function useInView<T extends Element = Element>({
  disabled = false,
  rootMargin = "0px",
  threshold = 0,
}: Options = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (disabled || inView || !node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, inView, rootMargin, threshold]);

  return [ref, inView];
}
