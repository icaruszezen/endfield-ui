import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionTitle } from "./SectionTitle";

describe("SectionTitle", () => {
  it("中文是真正的标题，默认 h2", () => {
    render(<SectionTitle latin="Gameplay">玩法介绍</SectionTitle>);
    expect(
      screen.getByRole("heading", { level: 2, name: "玩法介绍" }),
    ).toBeInTheDocument();
  });

  it("level 改变标题层级", () => {
    render(<SectionTitle level={3}>玩法介绍</SectionTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("英文默认对读屏隐藏，latinHidden=false 时保留", () => {
    const { rerender } = render(
      <SectionTitle latin="Gameplay">玩法介绍</SectionTitle>,
    );
    expect(screen.getByText("Gameplay")).toHaveAttribute("aria-hidden", "true");

    rerender(
      <SectionTitle latin="Gameplay" latinHidden={false}>
        玩法介绍
      </SectionTitle>,
    );
    expect(screen.getByText("Gameplay")).not.toHaveAttribute("aria-hidden");
  });

  it("没有 IntersectionObserver 时直接显示终态", () => {
    // jsdom 不实现 IntersectionObserver，等价于"无法判断是否进入视口"
    render(<SectionTitle latin="Gameplay">玩法介绍</SectionTitle>);
    expect(screen.getByRole("heading")).not.toHaveClass("opacity-0");
  });

  it("animate=false 时不带入场类", () => {
    render(
      <SectionTitle latin="Gameplay" animate={false}>
        玩法介绍
      </SectionTitle>,
    );
    const heading = screen.getByRole("heading");
    expect(heading).not.toHaveClass("opacity-0");
    expect(heading).not.toHaveClass("animate-fade-in");
  });

  it("band 渲染副题与主题", () => {
    render(
      <SectionTitle variant="band" subtitle="Field Manual">
        Lore
      </SectionTitle>,
    );
    expect(screen.getByRole("heading", { name: "Lore" })).toBeInTheDocument();
    expect(screen.getByText("Field Manual")).toBeInTheDocument();
  });

  it("转发 ref", () => {
    let node: HTMLElement | null = null;
    render(
      <SectionTitle
        ref={(element) => {
          node = element;
        }}
      >
        玩法介绍
      </SectionTitle>,
    );
    expect(node).toBeInstanceOf(HTMLElement);
  });
});
