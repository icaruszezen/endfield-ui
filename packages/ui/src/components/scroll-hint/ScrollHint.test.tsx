import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollHint } from "./ScrollHint";

/** 假装页面内容高 `content` px、视口高 600px、已经滚了 `scrolled` px */
function mockPage(content: number, scrolled = 0) {
  const page = document.documentElement;
  vi.spyOn(page, "scrollHeight", "get").mockReturnValue(content);
  vi.spyOn(page, "clientHeight", "get").mockReturnValue(600);
  vi.spyOn(window, "scrollY", "get").mockReturnValue(scrolled);
}

const hint = () => screen.getByTestId("hint");

describe("ScrollHint", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("纯装饰：对读屏隐藏，不挡点击", () => {
    mockPage(2000);
    render(<ScrollHint data-testid="hint" />);
    expect(hint()).toHaveAttribute("aria-hidden", "true");
    expect(hint()).toHaveClass("pointer-events-none");
    expect(hint()).toHaveTextContent("SCROLL");
  });

  it("页面还能往下滚时显示", () => {
    mockPage(2000);
    render(<ScrollHint data-testid="hint" />);
    expect(hint()).toHaveAttribute("data-visible");
    expect(hint()).toHaveClass("opacity-100");
  });

  it("页面不够长、滚不动时不显示", () => {
    mockPage(600);
    render(<ScrollHint data-testid="hint" />);
    expect(hint()).not.toHaveAttribute("data-visible");
    expect(hint()).toHaveClass("opacity-0");
  });

  it("滚动开始后隐藏，回到顶部又出现", () => {
    mockPage(2000);
    render(<ScrollHint data-testid="hint" />);
    expect(hint()).toHaveAttribute("data-visible");

    vi.spyOn(window, "scrollY", "get").mockReturnValue(120);
    act(() => {
      fireEvent.scroll(window);
    });
    expect(hint()).not.toHaveAttribute("data-visible");

    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    act(() => {
      fireEvent.scroll(window);
    });
    expect(hint()).toHaveAttribute("data-visible");
  });

  it("target：看指定的滚动容器，而不是页面", () => {
    mockPage(600);
    const target = createRef<HTMLDivElement>();
    function Frame() {
      return (
        <div ref={target}>
          <ScrollHint data-testid="hint" target={target} />
        </div>
      );
    }
    // 容器要在 ScrollHint 的 effect 之前量得到，所以先把尺寸挂到原型上
    vi.spyOn(HTMLDivElement.prototype, "scrollHeight", "get").mockReturnValue(
      900,
    );
    vi.spyOn(HTMLDivElement.prototype, "clientHeight", "get").mockReturnValue(
      300,
    );
    render(<Frame />);
    expect(hint()).toHaveAttribute("data-visible");

    vi.spyOn(HTMLDivElement.prototype, "scrollTop", "get").mockReturnValue(80);
    act(() => {
      fireEvent.scroll(target.current!);
    });
    expect(hint()).not.toHaveAttribute("data-visible");
  });

  it("两种画法：细竖线加光点，或折线箭头", () => {
    mockPage(2000);
    const { container, rerender } = render(<ScrollHint data-testid="hint" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector(".animate-scroll-hint")).not.toBeNull();

    rerender(<ScrollHint data-testid="hint" variant="chevron" label="下滑" />);
    expect(container.querySelector("svg")).toHaveClass("animate-scroll-hint");
    expect(hint()).toHaveTextContent("下滑");
  });
});
