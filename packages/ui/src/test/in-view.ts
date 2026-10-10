import { act } from "@testing-library/react";
import { vi } from "vitest";

/**
 * 测试里代替 `IntersectionObserver`：jsdom 没有它，`useInView` 会当成"已经在视口里"。
 * 桩上之后元素先不在视口里，调返回的函数才算进来。用完 `vi.unstubAllGlobals()`。
 */
export function stubInView(): () => void {
  const callbacks = new Set<IntersectionObserverCallback>();

  class Observer {
    private callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe() {
      callbacks.add(this.callback);
    }

    disconnect() {
      callbacks.delete(this.callback);
    }
  }

  vi.stubGlobal("IntersectionObserver", Observer);

  return () =>
    act(() => {
      for (const callback of callbacks) {
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      }
    });
}
