import { useState } from "react";

const NONE: ReadonlySet<string> = new Set();

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

/**
 * 一串 key 里哪几个是后来加进来的。一开始就在的不算；删掉之后又加回来的算。
 *
 * 给"新项淡入"用：入场的类只加在这几个上。一开始就有的不该在载入时播一遍，
 * 已经在的也不会因为别的项变了而重播——它一直带着那个类，动画只在挂上时播一次。
 */
export function useAddedKeys(keys: readonly string[]): ReadonlySet<string> {
  const [state, setState] = useState({ keys, added: NONE });
  if (!same(state.keys, keys)) {
    const before = new Set(state.keys);
    setState({
      keys,
      added: new Set(
        keys.filter((key) => !before.has(key) || state.added.has(key)),
      ),
    });
  }
  return state.added;
}
