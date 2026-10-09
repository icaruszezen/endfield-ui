import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackToTop } from "./BackToTop";

/** 假装页面已经滚了 `scrolled` px */
function scrollPageTo(scrolled: number) {
  vi.spyOn(window, "scrollY", "get").mockReturnValue(scrolled);
  act(() => {
    fireEvent.scroll(window);
  });
}

/** 假装系统开没开"减少动态效果" */
function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

// 没出现时 visibility 是 hidden，按角色查要带上 hidden
const button = () => screen.getByRole("button", { hidden: true });

describe("BackToTop", () => {
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("是一个按钮，默认的名称是「回到顶部」；aria-label 可换", () => {
    const { rerender } = render(<BackToTop />);
    expect(button()).toHaveAttribute("aria-label", "回到顶部");
    expect(button()).toHaveAttribute("type", "button");
    rerender(<BackToTop aria-label="回到列表开头" />);
    expect(button()).toHaveAttribute("aria-label", "回到列表开头");
  });

  it("没滚的时候不出现：看不见，也不在可访问树里", () => {
    render(<BackToTop />);
    expect(button()).not.toHaveAttribute("data-visible");
    expect(button()).toHaveClass("invisible", "opacity-0");
  });

  it("滚过阈值才出现，滚回来又消失", () => {
    render(<BackToTop />);
    scrollPageTo(300);
    expect(button()).not.toHaveAttribute("data-visible");

    scrollPageTo(401);
    expect(button()).toHaveAttribute("data-visible");
    expect(button()).toHaveClass("visible", "opacity-100");

    scrollPageTo(0);
    expect(button()).not.toHaveAttribute("data-visible");
  });

  it("threshold 改阈值", () => {
    render(<BackToTop threshold={80} />);
    scrollPageTo(120);
    expect(button()).toHaveAttribute("data-visible");
  });

  it("点了滚回顶部，平滑地滚", async () => {
    render(<BackToTop />);
    scrollPageTo(900);
    await userEvent.click(button());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("系统开了「减少动态效果」时直接跳过去", async () => {
    mockReducedMotion(true);
    render(<BackToTop />);
    scrollPageTo(900);
    await userEvent.click(button());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  // "下一次 Tab 落在页面第一个可聚焦的元素上"要真浏览器才测得出来，在浏览器实测里
  it("点了之后焦点交给页面；焦点一走就把临时加的 tabindex 收回来", async () => {
    render(
      <>
        <a href="#first">第一个链接</a>
        <BackToTop />
      </>,
    );
    scrollPageTo(900);
    await userEvent.click(button());
    expect(document.body).toHaveFocus();
    expect(document.body).toHaveAttribute("tabindex", "-1");
    // 它不是控件：不画一圈围住整页的焦点环
    expect(document.body.style.outline).toBe("none");

    act(() => {
      screen.getByRole("link", { name: "第一个链接" }).focus();
    });
    expect(document.body).not.toHaveAttribute("tabindex");
    expect(document.body.style.outline).toBe("");
  });

  it("target：看指定的滚动容器，滚的也是它，焦点交给它", async () => {
    const target = createRef<HTMLDivElement>();
    const containerScrollTo = vi.fn();
    function Frame() {
      return (
        <div
          ref={(node) => {
            target.current = node;
            if (node) node.scrollTo = containerScrollTo;
          }}
          data-testid="scroller"
        >
          <BackToTop target={target} threshold={100} />
        </div>
      );
    }
    render(<Frame />);
    // 页面滚了不算
    scrollPageTo(900);
    expect(button()).not.toHaveAttribute("data-visible");

    vi.spyOn(HTMLDivElement.prototype, "scrollTop", "get").mockReturnValue(160);
    act(() => {
      fireEvent.scroll(target.current!);
    });
    expect(button()).toHaveAttribute("data-visible");

    await userEvent.click(button());
    expect(containerScrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByTestId("scroller")).toHaveFocus();
  });

  it("容器本来就能聚焦时不动它的 tabindex", async () => {
    const target = createRef<HTMLDivElement>();
    render(
      <div ref={target} tabIndex={0} data-testid="scroller">
        <BackToTop target={target} threshold={0} />
      </div>,
    );
    vi.spyOn(HTMLDivElement.prototype, "scrollTop", "get").mockReturnValue(50);
    act(() => {
      fireEvent.scroll(target.current!);
    });
    await userEvent.click(button());
    const scroller = screen.getByTestId("scroller");
    expect(scroller).toHaveFocus();
    expect(scroller).toHaveAttribute("tabindex", "0");
  });

  it("onClick 里拦下来就不滚", async () => {
    render(<BackToTop onClick={(event) => event.preventDefault()} />);
    scrollPageTo(900);
    await userEvent.click(button());
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("默认钉在视口右下角的悬浮层；位置可以用 className 改掉", () => {
    const { rerender } = render(<BackToTop />);
    expect(button()).toHaveClass("fixed", "z-(--z-float)");
    rerender(<BackToTop className="absolute right-3 bottom-3" />);
    expect(button()).toHaveClass("absolute", "right-3", "bottom-3");
    expect(button()).not.toHaveClass("fixed");
  });
});
