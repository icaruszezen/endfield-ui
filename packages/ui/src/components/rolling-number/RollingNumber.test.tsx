import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubInView } from "../../test/in-view";
import { RollingNumber } from "./RollingNumber";

/** 往前走这么多毫秒：假时钟推着帧走 */
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

/** 根元素下的两份：终值，和滚动着的那一份（滚完就没有了） */
const parts = (container: HTMLElement) => {
  const root = container.firstElementChild!;
  return { root, final: root.children[0]!, moving: root.children[1] };
};

const reduceMotion = () =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("RollingNumber", () => {
  it("从 0 滚到终值，滚完只剩终值", () => {
    const { container } = render(<RollingNumber value={1280} />);
    const { root, final, moving } = parts(container);
    expect(moving).toHaveTextContent(/^0$/);
    expect(root).toHaveAttribute("data-rolling");

    advance(300);
    const halfway = Number(
      parts(container).moving!.textContent.replace(/,/g, ""),
    );
    expect(halfway).toBeGreaterThan(0);
    expect(halfway).toBeLessThan(1280);
    // 减速：时间过半，数已经过了大半
    expect(halfway).toBeGreaterThan(640);

    advance(400);
    expect(parts(container).moving).toBeUndefined();
    expect(root).toHaveTextContent(/^1,280$/);
    expect(root).not.toHaveAttribute("data-rolling");
    expect(final).not.toHaveClass("opacity-0");
  });

  it("滚的时候终值一直在（读屏读它、宽度由它占着），滚动的那一份对读屏隐藏", () => {
    const { container } = render(<RollingNumber value={1280} />);
    const { root, final, moving } = parts(container);
    expect(final).toHaveTextContent("1,280");
    expect(final).not.toHaveAttribute("aria-hidden");
    // 只是看不见，不是 hidden / visibility：还在无障碍树里，也还占着位置
    expect(final).toHaveClass("opacity-0");
    expect(moving).toHaveAttribute("aria-hidden", "true");
    // 叠在终值上面，不另占地方
    expect(root).toHaveClass("relative", "inline-block");
    expect(moving).toHaveClass("absolute", "inset-0");
    // 打印出来的是终值
    expect(final).toHaveClass("print:opacity-100");
    expect(moving).toHaveClass("print:hidden");
  });

  it("进视口才开始滚；没进之前停在 0", () => {
    const enter = stubInView();
    const { container } = render(<RollingNumber value={1280} />);
    advance(1000);
    expect(parts(container).moving).toHaveTextContent(/^0$/);

    enter();
    advance(700);
    expect(container).toHaveTextContent(/^1,280$/);
  });

  it("小数位数跟着终值；滚的过程中位数不变", () => {
    const { container } = render(<RollingNumber value={42.5} />);
    expect(parts(container).moving).toHaveTextContent(/^0\.0$/);
    advance(300);
    expect(parts(container).moving).toHaveTextContent(/^\d+\.\d$/);
    advance(400);
    expect(container).toHaveTextContent(/^42\.5$/);
  });

  it("format 换写法，每一帧都用它", () => {
    const percent = (value: number) => `${Math.round(value * 100)}%`;
    const { container } = render(
      <RollingNumber value={0.86} format={percent} />,
    );
    expect(parts(container).moving).toHaveTextContent(/^0%$/);
    advance(300);
    expect(parts(container).moving).toHaveTextContent(/^\d+%$/);
    advance(400);
    expect(container).toHaveTextContent(/^86%$/);
  });

  it("负数从 0 往下滚", () => {
    const { container } = render(<RollingNumber value={-320} />);
    advance(300);
    const halfway = Number(parts(container).moving!.textContent);
    expect(halfway).toBeLessThan(0);
    expect(halfway).toBeGreaterThan(-320);
    advance(400);
    expect(container).toHaveTextContent(/^-320$/);
  });

  it("减少动态效果：直接是终值，没有滚动的那一份", () => {
    reduceMotion();
    const { container } = render(<RollingNumber value={1280} />);
    const { root, final, moving } = parts(container);
    expect(moving).toBeUndefined();
    expect(root).toHaveTextContent(/^1,280$/);
    expect(final).not.toHaveClass("opacity-0");
    expect(root.className).not.toMatch(/inline-block/);
  });

  it("animate=false：直接是终值", () => {
    const { container } = render(
      <RollingNumber value={1280} animate={false} />,
    );
    expect(parts(container).moving).toBeUndefined();
    expect(container).toHaveTextContent(/^1,280$/);
    expect(container.firstElementChild).not.toHaveAttribute("animate");
  });

  it("滚完之后值变了直接换，不再滚", () => {
    const { container, rerender } = render(<RollingNumber value={1280} />);
    advance(700);
    rerender(<RollingNumber value={96} />);
    expect(parts(container).moving).toBeUndefined();
    expect(container).toHaveTextContent(/^96$/);
  });

  it("服务端渲染出来的是终值，不是 0", () => {
    const html = renderToString(<RollingNumber value={1280} />);
    expect(html).toContain("1,280");
    expect(html).not.toContain("aria-hidden");
    expect(html).not.toContain("opacity-0");
  });

  it("其余属性和 ref 落在根元素上", () => {
    let node: HTMLSpanElement | null = null;
    const { container } = render(
      <RollingNumber
        value={7}
        className="text-danger"
        data-testid="count"
        ref={(element) => {
          node = element;
        }}
      />,
    );
    const { root } = parts(container);
    expect(node).toBe(root);
    expect(root).toHaveClass("text-danger");
    expect(root).toHaveAttribute("data-testid", "count");
  });
});
