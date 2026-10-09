import { useCallback, useEffect, useRef } from "react";

/** 滚动停下之后多久算"停稳了"。没有 scrollend 事件的浏览器靠它 */
const SETTLE_MS = 120;

type SnapTrackOptions = {
  /** 现在是第几张，从 0 起 */
  index: number;
  /** 一共几张 */
  count: number;
  /** 用户自己滑、停稳在了第几张 */
  onSettle: (index: number) => void;
};

/**
 * 一条横向滚动加滚动吸附的轨道，每一张和轨道一样宽。下标和滚动位置互相跟：
 * 下标变了轨道滚过去；用户自己滑的时候反过来，等滚动停稳，由停下的位置定下标。
 * 手势、惯性都是浏览器的。媒体轮播和图片查看共用，不对外导出。
 *
 * 把 `trackRef` 和 `onScroll` 交给那个滚动容器。
 */
export function useSnapTrack({ index, count, onSettle }: SnapTrackOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const last = Math.max(0, count - 1);
  // 给不跟着渲染重建的回调（尺寸变化）读最新的下标
  const indexRef = useRef(index);
  indexRef.current = index;
  const placed = useRef(false);

  // 下标变了：滚过去。已经在那儿（用户自己滑过去的）就不动。
  // 刚挂上的那一次直接到位：从第一张一路滑到第三张不是谁想看的
  useEffect(() => {
    const first = !placed.current;
    placed.current = true;
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    if (Math.round(track.scrollLeft / track.clientWidth) === index) return;
    track.scrollTo?.({
      left: index * track.clientWidth,
      behavior: first ? "instant" : "smooth",
    });
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
      onSettle(Math.min(Math.max(stopped, 0), last));
    }, SETTLE_MS);
  }, [onSettle, last]);

  return { trackRef, onScroll };
}
