import { act } from "@testing-library/react";
import { onTestFinished } from "vitest";

/**
 * 测试里代替 `getAnimations()`：jsdom 没有它，"退场后再卸载"会当成没有动效、当场卸载。
 * 桩上之后每个元素上都有一个正在跑的动效，调返回的函数才算走完。
 * 传 `Infinity` 桩的是循环的动画。在测试体里调，这条测试结束时自己撤掉。
 */
export function stubAnimations(iterations = 1): () => Promise<void> {
  const pending: (() => void)[] = [];

  Object.defineProperty(Element.prototype, "getAnimations", {
    configurable: true,
    value: () => [
      {
        effect: { getComputedTiming: () => ({ iterations }) },
        finished: new Promise<void>((resolve) => {
          pending.push(resolve);
        }),
      },
    ],
  });
  onTestFinished(() => {
    delete (Element.prototype as { getAnimations?: unknown }).getAnimations;
  });

  return () =>
    act(async () => {
      for (const resolve of pending.splice(0)) resolve();
      // 承诺落定之后的那一步在微任务里
      await Promise.resolve();
    });
}
