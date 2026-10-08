import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GhostText } from "./GhostText";

describe("GhostText", () => {
  it("对读屏隐藏，不可点、不可选", () => {
    render(<GhostText data-testid="ghost">//Archive</GhostText>);
    const ghost = screen.getByTestId("ghost");
    expect(ghost).toHaveAttribute("aria-hidden", "true");
    expect(ghost).toHaveClass("pointer-events-none", "select-none");
  });

  it("三种画法", () => {
    const { rerender } = render(<GhostText data-testid="ghost">01</GhostText>);
    expect(screen.getByTestId("ghost")).toHaveClass("ghost-hatch");

    rerender(
      <GhostText data-testid="ghost" variant="outline">
        01
      </GhostText>,
    );
    expect(screen.getByTestId("ghost")).toHaveClass("ghost-outline");
    expect(screen.getByTestId("ghost")).not.toHaveClass("ghost-hatch");

    rerender(
      <GhostText data-testid="ghost" variant="solid">
        01
      </GhostText>,
    );
    expect(screen.getByTestId("ghost")).toHaveClass("text-ink");
  });

  it("字号可以换，画法不受影响", () => {
    render(
      <GhostText data-testid="ghost" variant="outline" className="text-6xl">
        01
      </GhostText>,
    );
    const ghost = screen.getByTestId("ghost");
    expect(ghost).toHaveClass("text-6xl", "ghost-outline");
    expect(ghost).not.toHaveClass("text-ghost");
  });
});
