import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubInView } from "../../test/in-view";
import { CompletionBanner } from "./CompletionBanner";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CompletionBanner", () => {
  it("是一个状态区，标题默认是三级", () => {
    render(<CompletionBanner title="第三阶段已完成" />);
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("第三阶段已完成");
    expect(
      screen.getByRole("heading", { level: 3, name: "第三阶段已完成" }),
    ).toBeInTheDocument();
  });

  it("整块是一个反转主题：行动按钮按这块底色取值", () => {
    render(
      <CompletionBanner
        title="全部完成"
        action={<button type="button">领取</button>}
      />,
    );
    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("data-theme", "inverse");
    expect(banner).toHaveClass("bg-surface", "text-ink");
    expect(screen.getByRole("heading")).toHaveClass("text-accent-ink");
    expect(
      screen.getByRole("button", { name: "领取" }).closest("[data-theme]"),
    ).toBe(banner);
  });

  it("标题层级可以换", () => {
    render(<CompletionBanner title="全部完成" level={2} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("背后的描边词是装饰，可以换、可以去掉", () => {
    const { rerender } = render(<CompletionBanner title="全部完成" />);
    const word = screen.getByText("COMPLETED");
    expect(word).toHaveAttribute("aria-hidden", "true");
    expect(word).toHaveClass("ghost-outline");

    rerender(<CompletionBanner title="全部完成" word="CLEAR" />);
    expect(screen.getByText("CLEAR")).toBeInTheDocument();

    rerender(<CompletionBanner title="全部完成" word={null} />);
    expect(screen.queryByText("CLEAR")).not.toBeInTheDocument();
    expect(
      screen.getByRole("status").querySelector("[aria-hidden]"),
    ).toBeNull();
  });

  it("说明与行动按需出现", () => {
    render(
      <CompletionBanner
        title="全部完成"
        description="共 6 项，用时 3 天"
        action={<button type="button">领取</button>}
      />,
    );
    expect(screen.getByText("共 6 项，用时 3 天")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "领取" })).toBeInTheDocument();
  });

  it("入场：进视口前整块是裁掉的；进了之后色带擦入，字和按钮晚 200ms 出", () => {
    const enter = stubInView();
    render(
      <CompletionBanner
        title="全部完成"
        action={<button type="button">领取</button>}
      />,
    );
    const banner = screen.getByRole("status");
    const text = screen.getByRole("heading").parentElement!;
    const action = screen.getByRole("button").parentElement!;
    expect(banner).toHaveClass("[clip-path:inset(0_100%_0_0)]");
    expect(banner).not.toHaveClass("animate-wipe-in");
    expect(text).not.toHaveClass("animate-shift-in");

    enter();
    expect(banner).toHaveClass("animate-wipe-in");
    expect(banner).not.toHaveClass("[clip-path:inset(0_100%_0_0)]");
    expect(text).toHaveClass(
      "animate-shift-in",
      "[animation-delay:200ms]",
      "[--shift-x:calc(var(--motion-shift-lg)*-1)]",
    );
    expect(action).toHaveClass("animate-fade-in", "[animation-delay:200ms]");
  });

  it("没法判断进没进视口时直接播（不会一直裁着）", () => {
    // jsdom 没有 IntersectionObserver
    render(<CompletionBanner title="全部完成" />);
    expect(screen.getByRole("status")).toHaveClass("animate-wipe-in");
  });

  it("animate=false 时不裁、不播", () => {
    stubInView();
    render(
      <CompletionBanner
        title="全部完成"
        animate={false}
        action={<button type="button">领取</button>}
      />,
    );
    const banner = screen.getByRole("status");
    expect(banner.className).not.toMatch(/clip-path|animate-/);
    expect(screen.getByRole("heading").parentElement!.className).not.toMatch(
      /animate-/,
    );
    expect(screen.getByRole("button").parentElement!.className).not.toMatch(
      /animate-/,
    );
  });

  it("转发 ref", () => {
    let node: HTMLDivElement | null = null;
    render(
      <CompletionBanner
        title="全部完成"
        ref={(element) => {
          node = element;
        }}
      />,
    );
    expect(node).toBe(screen.getByRole("status"));
  });
});
