import type { Ref, RefCallback } from "react";

/** 把几个 ref 合成一个：组件自己要用节点，同时还得把它交给使用方。 */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}
