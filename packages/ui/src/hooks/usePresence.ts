import { useLayoutEffect, useRef, useState, type RefObject } from "react";

type Options<T extends Element> = {
  /**
   * 开始退场、还没去看有没有动效在跑之前调。退场的起点要用脚本摆的在这里摆
   * （提示条量自己的高度）。返回的函数在退场被打断（中途又打开）时把摆上去的撤掉
   */
  onLeave?: (node: T) => void | (() => void);
  /** 退完、已经卸载之后 */
  onExited?: () => void;
};

export type Presence<T extends Element> = {
  /** 给会动的那个元素：退场时等的是它身上的过渡和动画 */
  ref: RefObject<T | null>;
  /** 该不该渲染 */
  mounted: boolean;
  /** 正在退场：`open` 已经是假的了，元素还留着 */
  leaving: boolean;
  /** 是后来才出现的。一开始就在的是 `false`——进场的起点只给后来出现的 */
  entered: boolean;
};

/** 循环的动画（加载指示那一类）等不到头，不等 */
function ends(animation: Animation) {
  return animation.effect?.getComputedTiming().iterations !== Infinity;
}

/**
 * 退场后再卸载：`open` 变成假之后元素先留着，等它身上的动效走完才卸载。
 *
 * 等的是这个元素上**正在跑的**过渡和动画，不另抄一份时长；一个都没有
 * （没有写退场的样式、测试环境里没有动效）就当场卸载。退场途中又打开：不卸载，
 * 过渡自己折回去。
 */
export function usePresence<T extends Element = HTMLElement>(
  open: boolean,
  { onLeave, onExited }: Options<T> = {},
): Presence<T> {
  const ref = useRef<T>(null);
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  // 打开：立刻挂上
  if (open && !mounted) {
    setMounted(true);
    setEntered(true);
  }
  const leaving = !open && mounted;

  const handlers = useRef({ onLeave, onExited });
  useLayoutEffect(() => {
    handlers.current = { onLeave, onExited };
  });

  useLayoutEffect(() => {
    if (!leaving) return;
    const node = ref.current;
    let live = true;
    const undo = node ? handlers.current.onLeave?.(node) : undefined;
    const exit = () => {
      if (!live) return;
      setMounted(false);
      handlers.current.onExited?.();
    };

    // 读这一下，浏览器会先把这次的样式变化算完：刚起的过渡已经在里面了。
    // `finished` 要现在就拿住——过渡被取消之后再去拿，拿到的是一个永远不落定的新承诺
    const running =
      typeof node?.getAnimations === "function"
        ? node.getAnimations().filter(ends)
        : [];
    if (running.length === 0) exit();
    else {
      void Promise.allSettled(
        running.map((animation) => animation.finished),
      ).then(exit);
    }

    return () => {
      live = false;
      undo?.();
    };
  }, [leaving]);

  return { ref, mounted, leaving, entered };
}
