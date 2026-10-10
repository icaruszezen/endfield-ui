import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIndicator } from "./useIndicator";

/* jsdom 不排版：按 data-box 给每个元素一个假的矩形 [left, top, width, height] */
type Box = [number, number, number, number];
let boxes: Record<string, Box> = {};

beforeEach(() => {
  boxes = {
    track: [100, 50, 304, 44],
    a: [102, 52, 100, 40],
    b: [202, 52, 100, 40],
    c: [302, 52, 100, 40],
  };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const [left, top, width, height] = boxes[
        (this as HTMLElement).dataset.box ?? ""
      ] ?? [0, 0, 0, 0];
      return {
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      };
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type TrackProps = {
  value?: string;
  items?: string[];
  enabled?: boolean;
};

function Track({ value, items = ["a", "b", "c"], enabled = true }: TrackProps) {
  const ref = useIndicator<HTMLDivElement>(enabled ? "[data-selected]" : null);
  return (
    <div ref={ref} data-testid="track" data-box="track">
      {items.map((item) => (
        <span
          key={item}
          data-box={item}
          data-selected={item === value ? "" : undefined}
        />
      ))}
    </div>
  );
}

const track = () => screen.getByTestId("track");
const vars = () =>
  ["x", "y", "w", "h"].map((name) =>
    track().style.getPropertyValue(`--indicator-${name}`),
  );

/** 这一步里有没有标过"不过渡"：标记是当场加、当场撤的，事后只能从变更记录里看 */
function watchInstant() {
  const observer = new MutationObserver(() => {});
  observer.observe(track(), {
    attributes: true,
    attributeFilter: ["data-indicator-instant"],
  });
  return () => observer.takeRecords().length > 0;
}

describe("useIndicator", () => {
  it("量不到（没有排版）时什么都不标：各项照旧自己画", () => {
    boxes = {};
    render(<Track value="a" />);
    expect(track()).not.toHaveAttribute("data-indicator");
    expect(vars()).toEqual(["", "", "", ""]);
  });

  it("第一次到位：当前项相对容器的位置和尺寸写成变量，标上 on", () => {
    render(<Track value="b" />);
    expect(track()).toHaveAttribute("data-indicator", "on");
    expect(vars()).toEqual(["102px", "2px", "100px", "40px"]);
    expect(track()).not.toHaveAttribute("data-indicator-instant");
  });

  it("换了一项：直接写新位置，不标 instant——过渡由 CSS 走", () => {
    const { rerender } = render(<Track value="a" />);
    const instant = watchInstant();
    rerender(<Track value="c" />);
    expect(vars()).toEqual(["202px", "2px", "100px", "40px"]);
    expect(instant()).toBe(false);
    expect(track()).toHaveAttribute("data-indicator", "on");
  });

  it("同一项挪了地方或变了大小：标着 instant 写，写完撤掉", () => {
    const { rerender } = render(<Track value="b" />);
    const instant = watchInstant();
    boxes.track = [100, 50, 404, 44];
    boxes.b = [235, 52, 133, 40];
    rerender(<Track value="b" />);
    expect(vars()).toEqual(["135px", "2px", "133px", "40px"]);
    expect(instant()).toBe(true);
    expect(track()).not.toHaveAttribute("data-indicator-instant");
  });

  it("位置没变就不写", () => {
    const { rerender } = render(<Track value="b" />);
    const write = vi.spyOn(track().style, "setProperty");
    rerender(<Track value="b" />);
    expect(write).not.toHaveBeenCalled();
  });

  it("没有当前项是 off，位置留在原地；再有的时候位置直接到，不算滑", () => {
    const { rerender } = render(<Track value="a" />);
    rerender(<Track />);
    expect(track()).toHaveAttribute("data-indicator", "off");
    expect(vars()).toEqual(["2px", "2px", "100px", "40px"]);

    const instant = watchInstant();
    rerender(<Track value="c" />);
    expect(track()).toHaveAttribute("data-indicator", "on");
    expect(vars()).toEqual(["202px", "2px", "100px", "40px"]);
    expect(instant()).toBe(true);
  });

  it("一开始就没有当前项：标 off，不写位置", () => {
    render(<Track />);
    expect(track()).toHaveAttribute("data-indicator", "off");
    expect(vars()).toEqual(["", "", "", ""]);
  });

  it("当前项自己没有尺寸（藏着）也算没有", () => {
    boxes.b = [0, 0, 0, 0];
    render(<Track value="b" />);
    expect(track()).toHaveAttribute("data-indicator", "off");
  });

  it("后来量不到了（容器藏起来）：撤掉标记和变量，回到各项自己画", () => {
    const { rerender } = render(<Track value="a" />);
    boxes = {};
    rerender(<Track value="a" />);
    expect(track()).not.toHaveAttribute("data-indicator");
    expect(vars()).toEqual(["", "", "", ""]);
  });

  it("边线和滚动位置算进去：变量是相对容器内边距那个盒子、按内容的坐标", () => {
    const { rerender } = render(<Track value="c" />);
    const node = track();
    Object.defineProperty(node, "clientLeft", { value: 1 });
    Object.defineProperty(node, "clientTop", { value: 3 });
    node.scrollLeft = 60;
    // 滚了 60 之后，那一项在屏幕上往左挪了 60
    boxes.c = [242, 52, 100, 40];
    rerender(<Track value="c" />);
    expect(vars()).toEqual(["201px", "-1px", "100px", "40px"]);
  });

  it("祖先带缩放：按矩形宽和排版宽的比折回去", () => {
    // 排版宽 304，屏幕上只有一半
    boxes = {
      track: [100, 50, 152, 22],
      a: [101, 51, 50, 20],
      b: [151, 51, 50, 20],
    };
    function Scaled() {
      const ref = useIndicator<HTMLDivElement>("[data-selected]");
      return (
        <div
          ref={ref}
          data-testid="track"
          data-box="track"
          style={{ width: 304 }}
        >
          <span data-box="a" />
          <span data-box="b" data-selected="" />
        </div>
      );
    }
    render(<Scaled />);
    expect(vars()).toEqual(["102px", "2px", "100px", "40px"]);
  });

  it("传 null 是不用：不标；用着的中途换成 null 就清掉", () => {
    const { rerender } = render(<Track value="a" enabled={false} />);
    expect(track()).not.toHaveAttribute("data-indicator");

    rerender(<Track value="a" />);
    expect(track()).toHaveAttribute("data-indicator", "on");
    rerender(<Track value="a" enabled={false} />);
    expect(track()).not.toHaveAttribute("data-indicator");
    expect(vars()).toEqual(["", "", "", ""]);
  });

  it("尺寸变了重新量：盯着容器和每一个直接子元素，新加的项也盯上", () => {
    const observed: Element[] = [];
    let notify = () => {};
    const disconnect = vi.fn(() => {
      observed.length = 0;
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        disconnect = disconnect;
      },
    );

    const { rerender, unmount } = render(<Track value="b" />);
    expect(observed).toEqual([track(), ...track().children]);

    // 字体到了，各项变宽：同一项，直接到位
    const instant = watchInstant();
    boxes.b = [222, 52, 120, 40];
    act(() => notify());
    expect(vars()).toEqual(["122px", "2px", "120px", "40px"]);
    expect(instant()).toBe(true);

    boxes.d = [342, 52, 100, 40];
    rerender(<Track value="b" items={["a", "b", "c", "d"]} />);
    expect(observed).toEqual([track(), ...track().children]);
    expect(observed).toHaveLength(5);

    unmount();
    expect(observed).toHaveLength(0);
  });
});
