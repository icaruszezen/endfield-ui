import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollArea } from "./ScrollArea";

/*
 * jsdom 不排版：内容有没有溢出要靠假的尺寸。滑块的长度、位置，拖动和点轨道，
 * 都是量出来的东西，在浏览器实测里看
 */
function overflow({ x = false, y = false }: { x?: boolean; y?: boolean }) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
    y ? 900 : 200,
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(
    x ? 900 : 300,
  );
}

// 基元量尺寸之前先等可视区上的动画走完；jsdom 没有这个方法
Object.defineProperty(HTMLElement.prototype, "getAnimations", {
  configurable: true,
  value: () => [],
});

/** 基元量尺寸是排在下一帧里的 */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ScrollArea", () => {
  it("渲染子元素；className、style 和 ref 给外框", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ScrollArea
        aria-label="日程"
        ref={ref}
        className="max-h-64"
        style={{ width: 240 }}
      >
        <p>首批测绘数据归档</p>
      </ScrollArea>,
    );
    expect(screen.getByText("首批测绘数据归档")).toBeInTheDocument();
    expect(ref.current).toHaveClass("max-h-64");
    expect(ref.current).toHaveStyle({ width: "240px" });
    expect(ref.current).toHaveAttribute("data-scroll-area");
    expect(ref.current).toHaveAttribute("data-orientation", "vertical");
    expect(ref.current).toContainElement(screen.getByText("首批测绘数据归档"));
  });

  it("viewportRef 交出真正在滚的那个元素，其余属性也落在它上面", () => {
    const viewportRef = createRef<HTMLDivElement>();
    const onScroll = vi.fn();
    render(
      <ScrollArea
        aria-label="日程"
        viewportRef={viewportRef}
        onScroll={onScroll}
        id="schedule"
      >
        <p>内容</p>
      </ScrollArea>,
    );
    const viewport = viewportRef.current!;
    expect(viewport).toHaveAttribute("id", "schedule");
    expect(viewport.style.overflow).toBe("scroll");
    viewport.dispatchEvent(new Event("scroll", { bubbles: true }));
    expect(onScroll).toHaveBeenCalled();
  });

  it("不溢出时不是区域、不占 Tab 停靠点，也没有滚动条", async () => {
    overflow({});
    const viewportRef = createRef<HTMLDivElement>();
    const { container } = render(
      <ScrollArea aria-label="日程" viewportRef={viewportRef}>
        <p>内容</p>
      </ScrollArea>,
    );
    await settle();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(viewportRef.current).toHaveAttribute("tabindex", "-1");
    expect(
      container.querySelector("[data-orientation][aria-hidden]"),
    ).toBeNull();
  });

  it("纵向溢出时可视区是一个有名称、能聚焦的区域，并出现一条纵向滚动条", async () => {
    overflow({ y: true });
    const { container } = render(
      <ScrollArea aria-label="日程">
        <p>内容</p>
      </ScrollArea>,
    );
    await settle();
    const region = screen.getByRole("region", { name: "日程" });
    expect(region).toHaveAttribute("tabindex", "0");
    const bars = container.querySelectorAll("[aria-hidden][data-orientation]");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("data-orientation", "vertical");
  });

  it("只管纵向时，横向溢出不算能滚，横向也被关掉", async () => {
    overflow({ x: true });
    const viewportRef = createRef<HTMLDivElement>();
    const { container } = render(
      <ScrollArea aria-label="日程" viewportRef={viewportRef}>
        <p>内容</p>
      </ScrollArea>,
    );
    await settle();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(viewportRef.current).toHaveAttribute("tabindex", "-1");
    expect(viewportRef.current!.style.overflowX).toBe("hidden");
    expect(
      container.querySelector("[aria-hidden][data-orientation]"),
    ).toBeNull();
  });

  it("horizontal：横向溢出时才是区域，纵向被关掉", async () => {
    overflow({ x: true });
    const viewportRef = createRef<HTMLDivElement>();
    const { container } = render(
      <ScrollArea
        aria-label="站点"
        orientation="horizontal"
        viewportRef={viewportRef}
      >
        <p>内容</p>
      </ScrollArea>,
    );
    await settle();
    expect(screen.getByRole("region", { name: "站点" })).toBe(
      viewportRef.current,
    );
    expect(viewportRef.current!.style.overflowY).toBe("hidden");
    const bars = container.querySelectorAll("[aria-hidden][data-orientation]");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("data-orientation", "horizontal");
  });

  it("both：两个方向各一条滚动条", async () => {
    overflow({ x: true, y: true });
    const { container } = render(
      <ScrollArea aria-label="测绘图" orientation="both">
        <p>内容</p>
      </ScrollArea>,
    );
    await settle();
    expect(screen.getByRole("region", { name: "测绘图" })).toBeInTheDocument();
    const bars = [
      ...container.querySelectorAll("[aria-hidden][data-orientation]"),
    ].map((bar) => bar.getAttribute("data-orientation"));
    expect(bars.sort()).toEqual(["horizontal", "vertical"]);
  });
});
