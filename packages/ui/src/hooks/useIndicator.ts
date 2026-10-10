import { useLayoutEffect, useRef, type RefObject } from "react";

const VARS = [
  "--indicator-x",
  "--indicator-y",
  "--indicator-w",
  "--indicator-h",
] as const;

function clear(node: HTMLElement) {
  if (node.dataset.indicator === undefined) return;
  delete node.dataset.indicator;
  for (const name of VARS) node.style.removeProperty(name);
}

/** 量一次、写一次。`last` 记着上一次指的是哪一项：换了才滑 */
function place(
  node: HTMLElement,
  selector: string,
  last: { current: Element | null },
) {
  const box = node.getBoundingClientRect();
  // 量不到（还没排版，或者藏着）：什么都不标，各项照旧自己画
  if (box.width === 0 || box.height === 0) {
    clear(node);
    last.current = null;
    return;
  }

  const item = node.querySelector(selector);
  const rect = item?.getBoundingClientRect();
  if (!item || !rect || rect.width === 0 || rect.height === 0) {
    // 一项都没有：指示留在原地淡出
    node.dataset.indicator = "off";
    last.current = null;
    return;
  }

  // 祖先带缩放时矩形是缩放之后的，变量要的是缩放之前的
  const laid = Number.parseFloat(getComputedStyle(node).width);
  const scale = laid > 0 ? box.width / laid : 1;
  const values = [
    (rect.left - box.left) / scale - node.clientLeft + node.scrollLeft,
    (rect.top - box.top) / scale - node.clientTop + node.scrollTop,
    rect.width / scale,
    rect.height / scale,
  ].map((value) => `${Math.round(value * 100) / 100}px`);

  const slide =
    node.dataset.indicator === "on" &&
    last.current !== null &&
    last.current !== item;
  last.current = item;

  if (
    VARS.some((name, at) => node.style.getPropertyValue(name) !== values[at])
  ) {
    // 第一次到位、从没有到有、同一项挪了地方或变了大小：直接到，不过渡
    if (!slide) node.dataset.indicatorInstant = "";
    VARS.forEach((name, at) => node.style.setProperty(name, values[at]!));
    if (!slide) {
      // 先让这一步落定再撤标记：不然浏览器看到的仍然是"变了"，照样过渡
      node.getBoundingClientRect();
      delete node.dataset.indicatorInstant;
    }
  }
  node.dataset.indicator = "on";
}

/**
 * 选中指示的位置：量出容器里"当前项"相对容器的位置和尺寸，写成容器上的 CSS 变量
 * （`--indicator-x` / `-y` / `-w` / `-h`），并在容器上标 `data-indicator`——`on` 是有当前项，
 * `off` 是没有。指示本身由用的地方画在容器的 `::after` 上（`lib/motion.ts` 的 `indicator`），
 * 换了一项时由 CSS 的过渡滑过去。
 *
 * 只有"换了一项"才滑；第一次到位、同一项挪了地方或变了大小（容器宽了、字体到了、
 * 前面多了一项）都直接到位。量不到（服务端、还没排版、藏着）时什么都不标，
 * 各项照旧自己画选中态——不会有哪一帧没有选中态。
 *
 * `current` 是当前项在容器里的选择器；传 `null` 是不用。
 */
export function useIndicator<T extends HTMLElement = HTMLElement>(
  current: string | null,
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const last = useRef<Element | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const watched = useRef<Element[]>([]);

  // 每次渲染后量一次：选中的换了、项多了少了，都落在这里
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (current === null) {
      clear(node);
      last.current = null;
      return;
    }
    place(node, current, last);

    // 盯着的是容器和它的每一个直接子元素：哪一个变了大小，当前项都可能跟着挪
    const watching = observer.current;
    if (!watching) return;
    const next = [node, ...node.children];
    const before = watched.current;
    if (
      next.length === before.length &&
      next.every((element, at) => element === before[at])
    ) {
      return;
    }
    watching.disconnect();
    for (const element of next) watching.observe(element);
    watched.current = next;
  });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || current === null || typeof ResizeObserver === "undefined") {
      return;
    }
    const watching = new ResizeObserver(() => place(node, current, last));
    const targets = [node, ...node.children];
    for (const element of targets) watching.observe(element);
    observer.current = watching;
    watched.current = targets;
    return () => {
      watching.disconnect();
      observer.current = null;
      watched.current = [];
    };
  }, [current]);

  return ref;
}
