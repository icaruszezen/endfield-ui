import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubInView } from "../../test/in-view";
import { Sparkline, sparklinePath } from "./Sparkline";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sparklinePath", () => {
  it("少于两个点时不画", () => {
    expect(sparklinePath([])).toBeNull();
    expect(sparklinePath([3])).toBeNull();
  });

  it("横向均分，最大值在顶上，最小值下面留四分之一", () => {
    // 范围 0–100：最小值往下再留 25，所以底是 -25、顶是 100
    const path = sparklinePath([0, 100, 50]);
    expect(path?.line).toBe("M0 80L50 0L100 40");
    expect(path?.area).toBe("M0 80L50 0L100 40L100 100L0 100Z");
  });

  it("可以钉死纵向范围，超出范围的值被压在边上", () => {
    expect(sparklinePath([0, 50, 200], { min: 0, max: 100 })?.line).toBe(
      "M0 100L50 50L100 0",
    );
  });

  it("所有的值都一样时画在正中", () => {
    expect(sparklinePath([7, 7, 7])?.line).toBe("M0 50L50 50L100 50");
  });
});

describe("Sparkline", () => {
  it("默认是纯装饰，对读屏隐藏", () => {
    const { container } = render(<Sparkline data={[1, 3, 2]} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("传 label 时是一张有名称的图", () => {
    render(<Sparkline data={[1, 3, 2]} label="近七天的产出" />);
    expect(
      screen.getByRole("img", { name: "近七天的产出" }),
    ).not.toHaveAttribute("aria-hidden");
  });

  it("area 是一块填充的面积，line 是一条不随拉伸变粗的折线", () => {
    const { container, rerender } = render(<Sparkline data={[1, 3, 2]} />);
    const area = container.querySelector("path");
    expect(area?.getAttribute("d")).toMatch(/Z$/);
    expect(area).toHaveClass("fill-data/75");

    rerender(<Sparkline data={[1, 3, 2]} variant="line" tone="danger" />);
    const line = container.querySelector("path");
    expect(line?.getAttribute("d")).not.toMatch(/Z$/);
    expect(line).toHaveAttribute("fill", "none");
    expect(line).toHaveAttribute("vector-effect", "non-scaling-stroke");
    expect(line).toHaveClass("stroke-alert");
  });

  it("数据不够时只留一个空的图，不报错", () => {
    const { container } = render(<Sparkline data={[5]} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("path")).not.toBeInTheDocument();
  });

  it("撑满给它的盒子，className 可以改尺寸", () => {
    const { container } = render(
      <Sparkline data={[1, 2]} className="h-full" data-testid="chart" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("preserveAspectRatio", "none");
    expect(svg).toHaveClass("h-full", "w-full");
    expect(svg).not.toHaveClass("h-8");
    expect(svg).toHaveAttribute("data-testid", "chart");
  });

  it("入场：进视口前整张裁掉；进了之后从左擦出来，600ms，盒子外面那一圈留着", () => {
    const enter = stubInView();
    const { container } = render(<Sparkline data={[1, 3, 2]} variant="line" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveClass("[clip-path:inset(0_100%_0_0)]");
    expect(svg).not.toHaveClass("animate-wipe-in");

    enter();
    expect(svg).toHaveClass(
      "animate-wipe-in",
      "[animation-duration:var(--duration-slower)]",
      "[--wipe-bleed:4px]",
      // 线宽的一半画在盒子外面：这个不能丢
      "overflow-visible",
    );
    expect(svg).not.toHaveClass("[clip-path:inset(0_100%_0_0)]");
  });

  it("animate=false 时不裁、不播；animate 不落到 DOM 上", () => {
    stubInView();
    const { container } = render(
      <Sparkline data={[1, 3, 2]} animate={false} />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).not.toMatch(/clip-path|animate-/);
    expect(svg).not.toHaveAttribute("animate");
  });

  it("转发 ref", () => {
    let node: SVGSVGElement | null = null;
    const { container } = render(
      <Sparkline
        data={[1, 3, 2]}
        ref={(element) => {
          node = element;
        }}
      />,
    );
    expect(node).toBe(container.querySelector("svg"));
  });
});
