import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toc, TocItem, type TocProps } from "./Toc";

/* jsdom 不排版：给每个小节一个假的位置，滚动就是改 scrollY 再发一个 scroll 事件 */
const tops: Record<string, number> = {
  bulletin: 100,
  fieldwork: 900,
  crew: 1700,
  station: 2300,
};
const PAGE = 3200;
const VIEWPORT = 800;
let scrollY = 0;

const scrollTo = (y: number) => {
  scrollY = y;
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
};

beforeEach(() => {
  scrollY = 0;
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    get: () => PAGE,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    get: () => VIEWPORT,
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const top = this.id in tops ? tops[this.id]! - scrollY : 0;
      return {
        top,
        bottom: top + 40,
        left: 0,
        right: 0,
        width: 0,
        height: 40,
        x: 0,
        y: top,
        toJSON: () => ({}),
      };
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function Page(props: Partial<TocProps>) {
  return (
    <>
      <Toc {...props}>
        <TocItem href="#bulletin">最新情报</TocItem>
        <TocItem href="#fieldwork">日常作业</TocItem>
        <TocItem href="#crew" level={2}>
          队员
        </TocItem>
        <TocItem href="#station">站点档案</TocItem>
        <TocItem href="#missing">页面上没有的一节</TocItem>
      </Toc>
      {Object.keys(tops).map((id) => (
        <h2 key={id} id={id}>
          {id}
        </h2>
      ))}
    </>
  );
}

const current = () =>
  screen
    .getAllByRole("link")
    .filter((link) => link.hasAttribute("aria-current"))
    .map((link) => link.textContent);

describe("Toc", () => {
  it("是一个有名称的导航，里面一个平的列表，每项是指向小节的链接", () => {
    render(<Page />);
    const nav = screen.getByRole("navigation", { name: "本页目录" });
    const items = within(nav).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    const link = within(nav).getByRole("link", { name: "日常作业" });
    expect(link).toHaveAttribute("href", "#fieldwork");
    expect(link.closest("ul")!.querySelector("ul")).toBeNull();
  });

  it("有小标时以它命名；自己传了 aria-label 就用传的", () => {
    const { rerender } = render(<Page title="// 本页" />);
    expect(
      screen.getByRole("navigation", { name: "// 本页" }),
    ).toBeInTheDocument();
    expect(screen.getByText("// 本页")).toHaveClass("font-tech", "text-xs");

    rerender(<Page title="// 本页" aria-label="文章目录" />);
    expect(
      screen.getByRole("navigation", { name: "文章目录" }),
    ).toBeInTheDocument();
  });

  it("层级只是缩进：每深一级多 12px", () => {
    render(
      <Toc>
        <TocItem href="#a">一级</TocItem>
        <TocItem href="#b" level={2}>
          二级
        </TocItem>
        <TocItem href="#c" level={3}>
          三级
        </TocItem>
      </Toc>,
    );
    expect(screen.getByRole("link", { name: "一级" })).toHaveClass("pl-4");
    expect(screen.getByRole("link", { name: "二级" })).toHaveClass("pl-7");
    expect(screen.getByRole("link", { name: "三级" })).toHaveClass("pl-10");
  });

  it("当前项是最后一个顶边到了上沿的小节；还没到第一节时哪一项都不亮", () => {
    render(<Page />);
    expect(current()).toEqual([]);

    scrollTo(100);
    expect(current()).toEqual(["最新情报"]);
    scrollTo(899);
    expect(current()).toEqual(["日常作业"]);
    scrollTo(1500);
    expect(current()).toEqual(["日常作业"]);
    scrollTo(1700);
    expect(current()).toEqual(["队员"]);
    // 往回滚也跟着
    scrollTo(300);
    expect(current()).toEqual(["最新情报"]);
    scrollTo(0);
    expect(current()).toEqual([]);
  });

  it("当前项：aria-current=location，引线上一段粗条，不加粗", () => {
    render(<Page />);
    scrollTo(900);
    const link = screen.getByRole("link", { name: "日常作业" });
    expect(link).toHaveAttribute("aria-current", "location");
    expect(link).toHaveClass("text-ink", "before:w-[3px]", "before:bg-ink");
    expect(link).not.toHaveClass("font-bold", "font-medium");
    const other = screen.getByRole("link", { name: "最新情报" });
    expect(other).not.toHaveAttribute("aria-current");
    expect(other).toHaveClass("text-ink-secondary");
  });

  it("粗条：列表上备着滑动的那一段；量不到位置时当前项照旧自己画", () => {
    render(<Page />);
    scrollTo(900);
    const list = screen.getByRole("list");
    expect(list).toHaveClass(
      "after:w-[3px]",
      "after:bg-ink",
      "after:translate-y-(--indicator-y)",
      "data-indicator:after:block",
    );
    // 这个文件里的假矩形宽度是 0：量不到，不标
    expect(list).not.toHaveAttribute("data-indicator");
    expect(screen.getByRole("link", { name: "日常作业" })).toHaveClass(
      "before:bg-ink",
      "in-data-indicator:before:hidden",
    );
  });

  it("粗条：量得到时写下当前项在列表里的位置和高度；一项都不亮是 off", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const box = (top: number, height: number) => ({
          top,
          bottom: top + height,
          left: 0,
          right: 200,
          width: 200,
          height,
          x: 0,
          y: top,
          toJSON: () => ({}),
        });
        if (this.id in tops) return box(tops[this.id]! - scrollY, 40);
        if (this.tagName === "UL") return box(300, 200);
        // 每项 36px 高，第三项折了行
        const index = [...document.querySelectorAll("nav a")].indexOf(this);
        if (index >= 0) return box(300 + index * 36, index === 2 ? 56 : 36);
        return box(0, 0);
      },
    );
    render(<Page />);
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("data-indicator", "off");

    scrollTo(900);
    expect(list).toHaveAttribute("data-indicator", "on");
    expect(list.style.getPropertyValue("--indicator-y")).toBe("36px");
    expect(list.style.getPropertyValue("--indicator-h")).toBe("36px");

    scrollTo(1700);
    expect(list.style.getPropertyValue("--indicator-y")).toBe("72px");
    expect(list.style.getPropertyValue("--indicator-h")).toBe("56px");

    scrollTo(0);
    expect(list).toHaveAttribute("data-indicator", "off");
  });

  it("滚到底时是最后一节——哪怕它的顶边到不了上沿；页面上没有的小节不算", () => {
    render(<Page />);
    // 最多能滚 2400，最后一节的顶边在 2300：差一点才到
    scrollTo(2290);
    expect(current()).toEqual(["队员"]);
    scrollTo(PAGE - VIEWPORT);
    expect(current()).toEqual(["站点档案"]);
  });

  it("offset：上沿往下让一段（吸顶的页头）", () => {
    render(<Page offset={80} />);
    // 第二节的顶边在 900：离上沿 80px（留 1px 的余量）就算到了
    scrollTo(818);
    expect(current()).toEqual(["最新情报"]);
    scrollTo(819);
    expect(current()).toEqual(["日常作业"]);
  });

  it("点一项：它立刻是当前项，保持到这次滚动停下、使用者自己再滚为止", () => {
    vi.useFakeTimers();
    render(<Page />);
    scrollTo(100);
    expect(current()).toEqual(["最新情报"]);

    fireEvent.click(screen.getByRole("link", { name: "站点档案" }));
    expect(current()).toEqual(["站点档案"]);

    // 浏览器正在滚过去：途中经过别的小节，亮的仍然是点的那一个
    scrollTo(900);
    expect(current()).toEqual(["站点档案"]);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    scrollTo(1700);
    expect(current()).toEqual(["站点档案"]);

    // 停下了。停下之后那一下滚动是使用者自己滚的：回到按位置算
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(current()).toEqual(["站点档案"]);
    scrollTo(1650);
    expect(current()).toEqual(["日常作业"]);
  });

  it("点的那一节本来就在眼前、页面没有滚：过一会儿也算停下", () => {
    vi.useFakeTimers();
    render(<Page />);
    fireEvent.click(screen.getByRole("link", { name: "队员" }));
    expect(current()).toEqual(["队员"]);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    scrollTo(100);
    expect(current()).toEqual(["最新情报"]);
  });

  it("点击可以被拦下：不算点了这一项", () => {
    render(
      <>
        <Toc>
          <TocItem href="#bulletin" onClick={(event) => event.preventDefault()}>
            最新情报
          </TocItem>
        </Toc>
        <h2 id="bulletin">最新情报</h2>
      </>,
    );
    fireEvent.click(screen.getByRole("link", { name: "最新情报" }));
    expect(current()).toEqual([]);
  });

  it("onActiveChange：当前的小节变了才报，一节都没到时是 null", () => {
    const onActiveChange = vi.fn();
    render(<Page onActiveChange={onActiveChange} />);
    expect(onActiveChange).not.toHaveBeenCalled();
    scrollTo(100);
    scrollTo(200);
    scrollTo(900);
    scrollTo(0);
    expect(onActiveChange.mock.calls).toEqual([
      ["bulletin"],
      ["fieldwork"],
      [null],
    ]);
  });

  it("小节是按 href 里 # 后面的 id 找的，写成转义的也认；render 时用 section 直接给", () => {
    tops["最新"] = 400;
    render(
      <>
        <Toc>
          <TocItem href="/page#%E6%9C%80%E6%96%B0">转义的</TocItem>
          <TocItem section="fieldwork" render={<a href="/routed" />}>
            路由的
          </TocItem>
        </Toc>
        <h2 id="最新">最新</h2>
        <h2 id="fieldwork">日常作业</h2>
      </>,
    );
    scrollTo(400);
    expect(current()).toEqual(["转义的"]);
    scrollTo(900);
    expect(current()).toEqual(["路由的"]);
    expect(screen.getByRole("link", { name: "路由的" })).toHaveAttribute(
      "href",
      "/routed",
    );
    delete tops["最新"];
  });

  it("target：内容在一个滚动容器里时，看的是它的滚动，位置相对它的上沿算", () => {
    function InContainer() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <>
          <Toc target={ref}>
            <TocItem href="#bulletin">最新情报</TocItem>
            <TocItem href="#fieldwork">日常作业</TocItem>
          </Toc>
          <div ref={ref} data-testid="scroller">
            <h2 id="bulletin">最新情报</h2>
            <h2 id="fieldwork">日常作业</h2>
          </div>
        </>
      );
    }
    render(<InContainer />);
    const scroller = screen.getByTestId("scroller");
    Object.defineProperty(scroller, "scrollHeight", { value: 2000 });
    Object.defineProperty(scroller, "clientHeight", { value: 400 });

    // 整页滚动不算数
    scrollTo(900);
    scrollY = 0;
    expect(current()).toEqual([]);

    scrollY = 900;
    Object.defineProperty(scroller, "scrollTop", {
      value: 900,
      configurable: true,
    });
    act(() => {
      scroller.dispatchEvent(new Event("scroll"));
    });
    expect(current()).toEqual(["日常作业"]);
  });

  it("className 和 ref 给 nav，其余属性也是", () => {
    const ref = { current: null as HTMLElement | null };
    render(<Page ref={ref} className="sticky top-6" data-testid="toc" />);
    const nav = screen.getByTestId("toc");
    expect(nav.tagName).toBe("NAV");
    expect(ref.current).toBe(nav);
    expect(nav).toHaveClass("sticky", "top-6");
  });
});
