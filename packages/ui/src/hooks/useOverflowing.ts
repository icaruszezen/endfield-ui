import { useEffect, useRef, useState } from "react";

/**
 * 容器里的内容是不是比容器宽、比容器高。
 * 给"只有真的能滚动时才是一个能聚焦的区域"用：表格、排期。
 * 盯着容器和它的第一个子元素的尺寸变化
 */
export function useOverflowing<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [x, setX] = useState(false);
  const [y, setY] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      setX(node.scrollWidth > node.clientWidth + 1);
      setY(node.scrollHeight > node.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return [ref, { x, y }] as const;
}
