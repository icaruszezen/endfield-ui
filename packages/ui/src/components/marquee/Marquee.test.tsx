import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Marquee } from "./Marquee";

/** 假装一份内容宽 300px、容器宽 `container` px */
function mockWidths(container: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 300,
  } as DOMRect);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
    container,
  );
}

describe("Marquee", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("内容渲染两份，副本对读屏隐藏且不可聚焦", () => {
    render(
      <Marquee data-testid="marquee">
        <a href="#">ENDFIELD</a>
      </Marquee>,
    );
    const track = screen.getByTestId("marquee").firstElementChild!;
    expect(track.children).toHaveLength(2);
    expect(track.children[0]).not.toHaveAttribute("aria-hidden");
    expect(track.children[1]).toHaveAttribute("aria-hidden", "true");
    expect(track.children[1]).toHaveAttribute("inert");
    // 读屏只读到一个链接
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("duration 写成动画时长，gap 是两份之间的间隔", () => {
    render(
      <Marquee data-testid="marquee" duration={32} gap="4rem">
        ENDFIELD
      </Marquee>,
    );
    const track = screen.getByTestId("marquee")
      .firstElementChild as HTMLElement;
    expect(track).toHaveClass("animate-marquee");
    expect(track).toHaveStyle({ animationDuration: "32s" });
    expect((track.children[0] as HTMLElement).style.marginRight).toBe("4rem");
  });

  it("paused 停住动画", () => {
    render(
      <Marquee data-testid="marquee" paused>
        ENDFIELD
      </Marquee>,
    );
    expect(screen.getByTestId("marquee").firstElementChild).toHaveClass(
      "[animation-play-state:paused]",
    );
  });

  it("pauseOnHover 可以关掉", () => {
    const { rerender } = render(
      <Marquee data-testid="marquee">ENDFIELD</Marquee>,
    );
    const hoverClass = "group-hover/marquee:[animation-play-state:paused]";
    expect(screen.getByTestId("marquee").firstElementChild).toHaveClass(
      hoverClass,
    );

    rerender(
      <Marquee data-testid="marquee" pauseOnHover={false}>
        ENDFIELD
      </Marquee>,
    );
    expect(screen.getByTestId("marquee").firstElementChild).not.toHaveClass(
      hoverClass,
    );
  });

  it("overflowOnly：放得下就不动，只渲染一份", () => {
    mockWidths(400);
    render(
      <Marquee data-testid="marquee" overflowOnly>
        短句
      </Marquee>,
    );
    const root = screen.getByTestId("marquee");
    expect(root).not.toHaveAttribute("data-moving");
    expect(root.firstElementChild!.children).toHaveLength(1);
    expect(root.firstElementChild).not.toHaveClass("animate-marquee");
  });

  it("overflowOnly：放不下才动起来", () => {
    mockWidths(200);
    render(
      <Marquee data-testid="marquee" overflowOnly>
        一段比容器长的文字
      </Marquee>,
    );
    const root = screen.getByTestId("marquee");
    expect(root).toHaveAttribute("data-moving");
    expect(root.firstElementChild!.children).toHaveLength(2);
    expect(root.firstElementChild).toHaveClass("animate-marquee");
  });
});
